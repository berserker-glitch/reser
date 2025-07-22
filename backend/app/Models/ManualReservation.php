<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ManualReservation extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'salon_id',
        'created_by_user_id',
        'employee_id',
        'service_id',
        'client_full_name',
        'client_phone',
        'start_at',
        'end_at',
        'status',
        'notes',
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

    // Status constants
    const STATUS_CONFIRMED = 'CONFIRMED';
    const STATUS_CANCELLED = 'CANCELLED';
    const STATUS_COMPLETED = 'COMPLETED';

    /**
     * Get the salon that owns the manual reservation.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    /**
     * Get the admin user who created this manual reservation.
     */
    public function createdByUser()
    {
        return $this->belongsTo(User::class, 'created_by_user_id');
    }

    /**
     * Get the employee that owns the manual reservation.
     */
    public function employee()
    {
        return $this->belongsTo(Employee::class);
    }

    /**
     * Get the service that owns the manual reservation.
     */
    public function service()
    {
        return $this->belongsTo(Service::class);
    }

    /**
     * Get the client name (always from manual entry for this model)
     */
    public function getClientNameAttribute()
    {
        return $this->client_full_name;
    }

    /**
     * Get the client phone (always from manual entry for this model)
     */
    public function getClientPhoneAttribute()
    {
        return $this->client_phone;
    }

    /**
     * Scope for confirmed manual reservations
     */
    public function scopeConfirmed($query)
    {
        return $query->where('status', self::STATUS_CONFIRMED);
    }

    /**
     * Scope for cancelled manual reservations
     */
    public function scopeCancelled($query)
    {
        return $query->where('status', self::STATUS_CANCELLED);
    }

    /**
     * Scope for completed manual reservations
     */
    public function scopeCompleted($query)
    {
        return $query->where('status', self::STATUS_COMPLETED);
    }

    /**
     * Scope for reservations by salon
     */
    public function scopeBySalon($query, $salonId)
    {
        return $query->where('salon_id', $salonId);
    }

    /**
     * Scope for reservations by employee
     */
    public function scopeByEmployee($query, $employeeId)
    {
        return $query->where('employee_id', $employeeId);
    }

    /**
     * Scope for reservations on a specific date
     */
    public function scopeOnDate($query, $date)
    {
        return $query->whereDate('start_at', $date);
    }

    /**
     * Scope for reservations between dates
     */
    public function scopeBetweenDates($query, $startDate, $endDate)
    {
        return $query->whereBetween('start_at', [$startDate, $endDate]);
    }
}
