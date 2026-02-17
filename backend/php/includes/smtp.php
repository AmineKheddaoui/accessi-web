<?php
/**
 * Lightweight SMTP client - no external dependencies.
 * Supports SSL (port 465) and STARTTLS (port 587).
 */
class SmtpClient {
    private $host;
    private $port;
    private $user;
    private $pass;
    private $socket;
    private $timeout = 30;
    private $lastError = '';

    public function __construct($host, $port, $user, $pass) {
        $this->host = $host;
        $this->port = (int)$port;
        $this->user = $user;
        $this->pass = $pass;
    }

    public function getLastError() {
        return $this->lastError;
    }

    public function send($from, $to, $subject, $htmlBody) {
        try {
            $this->connect();
            $this->ehlo();
            $this->authenticate();
            $this->mailFrom($from);
            $this->rcptTo($to);
            $this->data($from, $to, $subject, $htmlBody);
            $this->quit();
            return true;
        } catch (Exception $e) {
            $this->lastError = $e->getMessage();
            $this->close();
            return false;
        }
    }

    private function connect() {
        $protocol = ($this->port === 465) ? 'ssl://' : 'tcp://';
        $this->socket = @fsockopen(
            $protocol . $this->host,
            $this->port,
            $errno,
            $errstr,
            $this->timeout
        );

        if (!$this->socket) {
            throw new Exception("Connexion SMTP impossible: {$errstr} ({$errno})");
        }

        stream_set_timeout($this->socket, $this->timeout);
        $this->getResponse(220);
    }

    private function ehlo() {
        $this->sendCommand("EHLO " . gethostname(), 250);

        // STARTTLS for port 587
        if ($this->port === 587) {
            $this->sendCommand("STARTTLS", 220);
            $crypto = stream_socket_enable_crypto($this->socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT);
            if (!$crypto) {
                throw new Exception("STARTTLS echoue");
            }
            $this->sendCommand("EHLO " . gethostname(), 250);
        }
    }

    private function authenticate() {
        $this->sendCommand("AUTH LOGIN", 334);
        $this->sendCommand(base64_encode($this->user), 334);
        $this->sendCommand(base64_encode($this->pass), 235);
    }

    private function mailFrom($from) {
        $this->sendCommand("MAIL FROM:<{$from}>", 250);
    }

    private function rcptTo($to) {
        $this->sendCommand("RCPT TO:<{$to}>", 250);
    }

    private function data($from, $to, $subject, $htmlBody) {
        $this->sendCommand("DATA", 354);

        $boundary = md5(uniqid(time()));
        $headers = implode("\r\n", [
            "From: {$from}",
            "To: {$to}",
            "Subject: =?UTF-8?B?" . base64_encode($subject) . "?=",
            "MIME-Version: 1.0",
            "Content-Type: text/html; charset=UTF-8",
            "Content-Transfer-Encoding: base64",
            "Date: " . date('r'),
            "Message-ID: <" . md5(uniqid()) . "@" . gethostname() . ">",
        ]);

        $body = $headers . "\r\n\r\n" . chunk_split(base64_encode($htmlBody));

        // Escape leading dots
        $body = str_replace("\r\n.", "\r\n..", $body);

        fwrite($this->socket, $body . "\r\n.\r\n");
        $this->getResponse(250);
    }

    private function quit() {
        $this->sendCommand("QUIT", 221);
        $this->close();
    }

    private function sendCommand($command, $expectedCode) {
        fwrite($this->socket, $command . "\r\n");
        return $this->getResponse($expectedCode);
    }

    private function getResponse($expectedCode) {
        $response = '';
        while ($line = fgets($this->socket, 512)) {
            $response .= $line;
            // Last line of multi-line response has space after code
            if (isset($line[3]) && $line[3] === ' ') {
                break;
            }
        }

        $code = (int)substr($response, 0, 3);
        if ($code !== $expectedCode) {
            throw new Exception("SMTP erreur {$code}: {$response} (attendu: {$expectedCode})");
        }

        return $response;
    }

    private function close() {
        if ($this->socket) {
            @fclose($this->socket);
            $this->socket = null;
        }
    }
}
?>
