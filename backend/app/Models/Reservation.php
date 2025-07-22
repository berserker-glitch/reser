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
        'salon_id',
        'client_id',
        'employee_id',
        'service_id',
        'start_at',
        'end_at',
        'status',
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

    // Note: Reservation types removed as 'type' column doesn't exist in database

    // Status constants
    const STATUS_REQUESTED = 'REQUESTED';
    const STATUS_CONFIRMED = 'CONFIRMED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_COMPLETED = 'COMPLETED';

    /**
     * Get the salon that owns the reservation.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

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
     * Get the client name from the associated user
     */
    public function getClientNameAttribute()
    {
        return $this->client ? $this->client->full_name : 'Client inconnu';
    }

    /**
     * Get the client phone from the associated user
     */
    public function getClientPhoneAttribute()
    {
        return $this->client ? $this->client->phone : null;
    }

    /**
     * Scope for online reservations (all reservations are now online with registered clients)
     */
    public function scopeOnline($query)
    {
        return $query->whereNotNull('client_id');
    }
}
