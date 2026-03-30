<?php
// app/Models/PresupuestoLegacy.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresupuestoLegacy extends Model
{
    protected $table = 'presupuestos_legacy';
    
    public $timestamps = true;
    
    protected $casts = [
        'metadata' => 'array',
        'fecha_presupuesto' => 'datetime',
        'created_at' => 'datetime'
    ];
    
    protected $appends = ['pdf_url'];
    
    protected $fillable = [
        'id',
        'lead_id',
        'prefijo_id',
        'nombre_presupuesto',
        'fecha_presupuesto',
        'total',
        'pdf_path',
        'metadata'
    ];
    
    /**
     * Relación con el lead
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
    
    /**
     * Relación con el prefijo (comercial/resolución)
     */
    public function prefijo(): BelongsTo
    {
        return $this->belongsTo(Prefijo::class);
    }
    
    /**
     * Getter para la URL del PDF
     */
    public function getPdfUrlAttribute(): ?string
    {
        return $this->pdf_path ? asset('storage/' . $this->pdf_path) : null;
    }
    
    /**
     * Getter para resumen formateado
     */
    public function getResumenAttribute(): array
    {
        $fecha = $this->fecha_presupuesto ? 
            $this->fecha_presupuesto->format('d/m/Y H:i') : 
            'Sin fecha';
            
        return [
            'id' => $this->id,
            'nombre' => $this->nombre_presupuesto ?? "Presupuesto #{$this->id}",
            'fecha' => $fecha,
            'fecha_original' => $this->fecha_presupuesto?->toISOString(),
            'total' => $this->total ?? 0,
            'total_formateado' => '$ ' . number_format($this->total ?? 0, 2, ',', '.'),
            'tiene_pdf' => !is_null($this->pdf_path),
            'prefijo_id' => $this->prefijo_id,
            'resolucion' => $this->prefijo ? ($this->prefijo->codigo . ($this->prefijo->nombre ? ' - ' . $this->prefijo->nombre : '')) : ''
        ];
    }
}