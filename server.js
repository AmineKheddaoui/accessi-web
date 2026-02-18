/**
 * Local development server with form handling.
 *
 * Usage:  node server.js
 * Opens:  http://localhost:8000
 *
 * Handles static files, clean URL routing, and form submissions
 * (contact + order) with real SMTP email sending via OVH.
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const tls = require('tls');

const PORT = 8000;
const ROOT = __dirname;

// ─── Config ───
let config = null;
try {
    // Parse the PHP config file to extract values
    const configContent = fs.readFileSync(path.join(ROOT, 'backend/php/config.php'), 'utf8');
    config = {};
    const extract = (key) => {
        const match = configContent.match(new RegExp(`'${key}'\\s*=>\\s*'([^']*)'`));
        return match ? match[1] : null;
    };
    const extractNum = (key) => {
        const match = configContent.match(new RegExp(`'${key}'\\s*=>\\s*(\\d+)`));
        return match ? parseInt(match[1]) : null;
    };
    config.smtp_host = extract('smtp_host');
    config.smtp_port = extractNum('smtp_port');
    config.smtp_user = extract('smtp_user');
    config.smtp_pass = extract('smtp_pass');
    config.from_email = extract('from_email');
    config.admin_email = extract('admin_email');
    config.db_host = extract('db_host');
    console.log('Config loaded: SMTP via ' + config.smtp_host + ':' + config.smtp_port);
} catch (e) {
    console.warn('Warning: backend/php/config.php not found. Form submissions will fail.');
}

// ─── MIME Types ───
const MIME = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
};

// ─── URL Routing ───
const pages = {
    '/': '/frontend/index.html',
    '/essential': '/frontend/essential.html',
    '/business': '/frontend/business.html',
    '/enterprise': '/frontend/enterprise.html',
    '/contact': '/frontend/contact.html',
    '/blog': '/frontend/blog.html',
    '/a-propos': '/frontend/a-propos.html',
    '/simulateur': '/frontend/simulateur.html',
    '/logos': '/frontend/logos.html',
};

// ─── SMTP Client ───
function smtpSend(from, to, subject, htmlBody) {
    return new Promise((resolve, reject) => {
        if (!config || !config.smtp_host) {
            return reject(new Error('SMTP config missing'));
        }

        const socket = tls.connect(config.smtp_port, config.smtp_host, { rejectUnauthorized: false }, () => {
            let step = 'greeting';
            let buffer = '';

            socket.on('data', (data) => {
                buffer += data.toString();

                // Wait for complete response (ends with \r\n and has space after code)
                if (!buffer.includes('\r\n')) return;
                const lines = buffer.split('\r\n').filter(l => l.length > 0);
                const lastLine = lines[lines.length - 1];
                if (lastLine.length >= 4 && lastLine[3] === '-') return; // Multi-line, wait for more

                const code = parseInt(buffer.substring(0, 3));
                buffer = '';

                switch (step) {
                    case 'greeting':
                        if (code !== 220) return reject(new Error('SMTP greeting failed: ' + code));
                        step = 'ehlo';
                        socket.write('EHLO localhost\r\n');
                        break;
                    case 'ehlo':
                        if (code !== 250) return reject(new Error('EHLO failed: ' + code));
                        step = 'auth';
                        socket.write('AUTH LOGIN\r\n');
                        break;
                    case 'auth':
                        if (code !== 334) return reject(new Error('AUTH failed: ' + code));
                        step = 'user';
                        socket.write(Buffer.from(config.smtp_user).toString('base64') + '\r\n');
                        break;
                    case 'user':
                        if (code !== 334) return reject(new Error('User rejected: ' + code));
                        step = 'pass';
                        socket.write(Buffer.from(config.smtp_pass).toString('base64') + '\r\n');
                        break;
                    case 'pass':
                        if (code !== 235) return reject(new Error('Auth failed: ' + code));
                        step = 'from';
                        socket.write(`MAIL FROM:<${from}>\r\n`);
                        break;
                    case 'from':
                        if (code !== 250) return reject(new Error('MAIL FROM rejected: ' + code));
                        step = 'rcpt';
                        socket.write(`RCPT TO:<${to}>\r\n`);
                        break;
                    case 'rcpt':
                        if (code !== 250) return reject(new Error('RCPT TO rejected: ' + code));
                        step = 'data';
                        socket.write('DATA\r\n');
                        break;
                    case 'data':
                        if (code !== 354) return reject(new Error('DATA rejected: ' + code));
                        step = 'body';
                        const encoded = Buffer.from(htmlBody).toString('base64');
                        const msg = [
                            `From: ${from}`,
                            `To: ${to}`,
                            `Subject: =?UTF-8?B?${Buffer.from(subject).toString('base64')}?=`,
                            'MIME-Version: 1.0',
                            'Content-Type: text/html; charset=UTF-8',
                            'Content-Transfer-Encoding: base64',
                            `Date: ${new Date().toUTCString()}`,
                            '',
                            encoded.match(/.{1,76}/g).join('\r\n'),
                            '.',
                        ].join('\r\n') + '\r\n';
                        socket.write(msg);
                        break;
                    case 'body':
                        if (code !== 250) return reject(new Error('Message rejected: ' + code));
                        step = 'quit';
                        socket.write('QUIT\r\n');
                        break;
                    case 'quit':
                        socket.end();
                        resolve(true);
                        break;
                }
            });
        });

        socket.on('error', (err) => reject(err));
        socket.setTimeout(30000, () => {
            socket.destroy();
            reject(new Error('SMTP timeout'));
        });
    });
}

// ─── Parse multipart form data ───
function parseFormData(req) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (c) => chunks.push(c));
        req.on('end', () => {
            const body = Buffer.concat(chunks).toString();
            const contentType = req.headers['content-type'] || '';
            const fields = {};

            if (contentType.includes('multipart/form-data')) {
                const boundary = contentType.split('boundary=')[1];
                if (boundary) {
                    const parts = body.split('--' + boundary).slice(1, -1);
                    for (const part of parts) {
                        const match = part.match(/name="([^"]+)"\r\n\r\n([\s\S]*?)\r\n$/);
                        if (match) {
                            fields[match[1]] = match[2].trim();
                        }
                    }
                }
            } else {
                // URL-encoded
                const params = new URLSearchParams(body);
                for (const [k, v] of params) {
                    fields[k] = v;
                }
            }
            resolve(fields);
        });
        req.on('error', reject);
    });
}

// ─── Form Handlers ───
async function handleContact(fields) {
    // Validate
    const required = ['contact_name', 'contact_email', 'contact_subject', 'contact_message'];
    for (const f of required) {
        if (!fields[f]) throw new Error(`Le champ ${f} est requis`);
    }

    const validSubjects = ['devis', 'info', 'urgence', 'formation', 'autre'];
    if (!validSubjects.includes(fields.contact_subject)) throw new Error('Sujet invalide');

    const subjectLabels = {
        devis: 'Demande de devis', info: 'Informations generales',
        urgence: 'Projet urgent', formation: 'Formation equipe', autre: 'Autre demande'
    };
    const label = subjectLabels[fields.contact_subject] || 'Demande';

    // Send confirmation to client
    let clientSent = false, adminSent = false;
    try {
        await smtpSend(config.from_email, fields.contact_email,
            'Message recu - Accessi-web',
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#004D57;color:white;padding:20px;text-align:center"><h1>Accessi-web</h1><p>Votre message a ete recu</p></div>
                <div style="padding:20px;background:#f9f9f9">
                    <p>Bonjour ${esc(fields.contact_name)},</p>
                    <p>Nous avons bien recu votre message concernant : <strong>${label}</strong></p>
                    <div style="background:white;padding:15px;border-left:4px solid #004D57;margin:15px 0">${esc(fields.contact_message).replace(/\n/g, '<br>')}</div>
                    <p>Nous vous repondrons sous <strong>24 heures</strong>.</p>
                </div>
                <div style="padding:20px;text-align:center;color:#666"><p>Accessi-web - Expert en Accessibilite Numerique<br>contact@accessi-web.com</p></div>
            </div>`
        );
        clientSent = true;
    } catch (e) { console.error('Client email error:', e.message); }

    try {
        const urgency = fields.contact_subject === 'urgence' ? 'URGENT - ' : '';
        await smtpSend(config.from_email, config.admin_email,
            `${urgency}Nouveau message de contact - ${label}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#333;color:white;padding:20px"><h1>${urgency}Nouveau message de contact</h1><p>Sujet : ${label}</p></div>
                <div style="padding:20px">
                    <p><strong>Nom :</strong> ${esc(fields.contact_name)}</p>
                    <p><strong>Email :</strong> ${esc(fields.contact_email)}</p>
                    <p><strong>Telephone :</strong> ${esc(fields.contact_phone || 'Non renseigne')}</p>
                    <p><strong>Message :</strong></p>
                    <div style="background:#f9f9f9;padding:15px;border-left:4px solid #004D57">${esc(fields.contact_message).replace(/\n/g, '<br>')}</div>
                    <p><strong>Action requise :</strong> Repondre sous 24h</p>
                </div>
            </div>`
        );
        adminSent = true;
    } catch (e) { console.error('Admin email error:', e.message); }

    return { success: true, message: 'Message envoye avec succes', emails_sent: { client: clientSent, admin: adminSent } };
}

async function handleOrder(fields) {
    const required = ['offer_type', 'company_name', 'contact_name', 'email', 'website_url'];
    for (const f of required) {
        if (!fields[f]) throw new Error(`Le champ ${f} est requis`);
    }

    const validOffers = ['essential', 'business', 'enterprise'];
    if (!validOffers.includes(fields.offer_type)) throw new Error("Type d'offre invalide");

    const prices = { essential: 199, business: 399, enterprise: 1000 };
    const price = prices[fields.offer_type];
    const offerName = fields.offer_type.charAt(0).toUpperCase() + fields.offer_type.slice(1);

    let clientSent = false, adminSent = false;
    try {
        await smtpSend(config.from_email, fields.email,
            `Confirmation de commande - ${offerName}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#004D57;color:white;padding:20px;text-align:center"><h1>Accessi-web</h1><p>Confirmation de votre commande</p></div>
                <div style="padding:20px;background:#f9f9f9">
                    <p>Bonjour ${esc(fields.contact_name)},</p>
                    <p>Nous avons bien recu votre commande pour l'offre <strong>${offerName}</strong>.</p>
                    <ul>
                        <li><strong>Entreprise :</strong> ${esc(fields.company_name)}</li>
                        <li><strong>Contact :</strong> ${esc(fields.contact_name)}</li>
                        <li><strong>Email :</strong> ${esc(fields.email)}</li>
                        <li><strong>Site web :</strong> ${esc(fields.website_url)}</li>
                        <li><strong>Prix :</strong> <span style="font-size:24px;font-weight:bold;color:#004D57">${price} EUR</span></li>
                    </ul>
                    <p>Nous vous contacterons sous 24h pour planifier votre audit.</p>
                </div>
                <div style="padding:20px;text-align:center;color:#666"><p>Accessi-web - Expert en Accessibilite Numerique<br>contact@accessi-web.com</p></div>
            </div>`
        );
        clientSent = true;
    } catch (e) { console.error('Client email error:', e.message); }

    try {
        await smtpSend(config.from_email, config.admin_email,
            `Nouvelle commande - ${offerName}`,
            `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
                <div style="background:#333;color:white;padding:20px"><h1>Nouvelle commande recue</h1></div>
                <div style="padding:20px">
                    <p><strong>Offre :</strong> ${offerName}</p>
                    <p><strong>Entreprise :</strong> ${esc(fields.company_name)}</p>
                    <p><strong>Contact :</strong> ${esc(fields.contact_name)}</p>
                    <p><strong>Email :</strong> ${esc(fields.email)}</p>
                    <p><strong>Telephone :</strong> ${esc(fields.phone || 'Non renseigne')}</p>
                    <p><strong>Site web :</strong> ${esc(fields.website_url)}</p>
                    <p><strong>Problemes actuels :</strong> ${esc(fields.current_issues || '-')}</p>
                    <p><strong>Objectifs :</strong> ${esc(fields.accessibility_goals || '-')}</p>
                    <p><strong>Delais :</strong> ${esc(fields.timeline || '-')}</p>
                    <p><strong>Budget :</strong> ${esc(fields.budget_range || '-')}</p>
                    <p><strong>Infos supplementaires :</strong> ${esc(fields.additional_info || '-')}</p>
                </div>
            </div>`
        );
        adminSent = true;
    } catch (e) { console.error('Admin email error:', e.message); }

    return { success: true, message: 'Commande enregistree avec succes', emails_sent: { client: clientSent, admin: adminSent } };
}

function esc(str) {
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ─── HTTP Server ───
const server = http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://localhost:${PORT}`);
    const pathname = url.pathname;

    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return; }

    // POST endpoints
    if (req.method === 'POST') {
        res.setHeader('Content-Type', 'application/json');
        try {
            const fields = await parseFormData(req);
            let result;
            if (pathname === '/process-contact.php') {
                result = await handleContact(fields);
            } else if (pathname === '/process-order.php') {
                result = await handleOrder(fields);
            } else {
                res.writeHead(404);
                res.end(JSON.stringify({ success: false, message: 'Endpoint introuvable' }));
                return;
            }
            res.writeHead(200);
            res.end(JSON.stringify(result));
        } catch (err) {
            console.error('Handler error:', err.message);
            res.writeHead(400);
            res.end(JSON.stringify({ success: false, message: err.message }));
        }
        return;
    }

    // Clean URL routing
    const normalized = pathname.replace(/\/$/, '') || '/';
    if (pages[normalized]) {
        const filePath = path.join(ROOT, pages[normalized]);
        if (fs.existsSync(filePath)) {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            fs.createReadStream(filePath).pipe(res);
            return;
        }
    }

    // Static files
    const filePath = path.join(ROOT, pathname);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
        fs.createReadStream(filePath).pipe(res);
        return;
    }

    // 404
    const notFound = path.join(ROOT, 'frontend/404.html');
    if (fs.existsSync(notFound)) {
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(notFound).pipe(res);
    } else {
        res.writeHead(404);
        res.end('404 Not Found');
    }
});

server.listen(PORT, () => {
    console.log(`\n  Accessi-web dev server running at http://localhost:${PORT}\n`);
    console.log('  Routes:');
    Object.keys(pages).forEach(p => console.log(`    ${p}`));
    console.log('\n  Endpoints:');
    console.log('    POST /process-contact.php');
    console.log('    POST /process-order.php');
    console.log('');
});
