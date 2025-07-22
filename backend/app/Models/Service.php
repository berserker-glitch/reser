<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'salon_id',
        'name',
        'description',
        'duration_min',
        'price_dhs',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'duration_min' => 'integer',
        'price_dhs' => 'decimal:2',
    ];

    /**
     * Get the salon that owns the service.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    /**
     * The employees that belong to the service.
     */
    public function employees()
    {
        return $this->belongsToMany(Employee::class, 'employee_service');
    }

    /**
     * Get the reservations for the service.
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
