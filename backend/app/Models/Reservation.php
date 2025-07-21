<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'client_id',
        'employee_id',
        'service_id',
        'start_at',
        'end_at',
        'status',
        'type',
        'client_phone',
        'client_full_name',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'start_at' => 'datetime',
        'end_at' => 'datetime',
    ];

    // Reservation types
    const TYPE_ONLINE = 'online';
    const TYPE_MANUAL = 'manual';

    // Status constants
    const STATUS_REQUESTED = 'REQUESTED';
    const STATUS_CONFIRMED = 'CONFIRMED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_COMPLETED = 'COMPLETED';

    /**
     * Get the client that owns the reservation.
     */
    public function client()
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    /**
     * Get the employee that owns the reservation.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the service that owns the reservation.
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the client name (either from user or manual entry)
     */
    public function getClientNameAttribute()
    {
        if ($this->type === self::TYPE_MANUAL && $this->attributes['client_full_name']) {
            return $this->attributes['client_full_name'];
        }
        
        return $this->client ? $this->client->full_name : 'Client inconnu';
    }

    /**
     * Get the client phone (either from user or manual entry)
     */
    public function getClientPhoneAttribute()
    {
        if ($this->type === self::TYPE_MANUAL && $this->attributes['client_phone']) {
            return $this->attributes['client_phone'];
        }
        
        return $this->client ? $this->client->phone : null;
    }

    /**
     * Scope for manual reservations
     */
    public function scopeManual($query)
    {
        return $query->where('type', self::TYPE_MANUAL);
    }

    /**
     * Scope for online reservations
     */
    public function scopeOnline($query)
    {
        return $query->where('type', self::TYPE_ONLINE);
    }
}
