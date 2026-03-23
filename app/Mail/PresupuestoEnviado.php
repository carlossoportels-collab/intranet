<?php
// app/Mail/PresupuestoEnviado.php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class PresupuestoEnviado extends Mailable
{
    use Queueable, SerializesModels;

    public $data;
    public $pdfPath;
    public $fromEmail;
    public $fromName;
    public $compania;

    public function __construct($data, $pdfPath = null, $fromEmail = null, $fromName = null, $compania = null)
    {
        $this->data = $data;
        $this->pdfPath = $pdfPath;
        $this->fromEmail = $fromEmail;
        $this->fromName = $fromName;
        $this->compania = $compania;
    }

    public function build()
    {
        $fromEmail = $this->fromEmail ?? env('MAIL_FROM_ADDRESS', 'noreply@localsat.com.ar');
        $fromName = $this->fromName ?? env('MAIL_FROM_NAME', 'LocalSat');
        
        $mail = $this->from($fromEmail, $fromName)
                    ->subject($this->data['subject'])
                    ->view('emails.presupuesto')
                    ->with([
                        'body' => $this->data['body'],
                        'compania' => $this->compania,
                        'data' => $this->data
                    ]);

        if ($this->pdfPath && file_exists($this->pdfPath)) {
            $mail->attach($this->pdfPath, [
                'as' => $this->data['filename'] ?? 'presupuesto.pdf',
                'mime' => 'application/pdf',
            ]);
        }

        if (!empty($this->data['cc'])) {
            $mail->cc($this->data['cc']);
        }
        
        if (!empty($this->data['bcc'])) {
            $mail->bcc($this->data['bcc']);
        }

        return $mail;
    }
}