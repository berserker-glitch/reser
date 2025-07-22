<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Salon extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'name',
        'description',
        'owner_id',
        'address',
        'phone',
        'email',
    ];

    /**
     * Get the owner of the salon.
     */
    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    /**
     * Get the employees for the salon.
     */
    public function employees()
    {
        return $this->hasMany(Employee::class);
    }

    /**
     * Get the services for the salon.
     */
    public function services()
    {
        return $this->hasMany(Service::class);
    }

    /**
     * Get the working hours for the salon.
     */
    public function workingHours()
    {
        return $this->hasMany(WorkingHour::class);
    }

    /**
     * Get the reservations for the salon.
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }

    /**
     * Get the holidays for the salon.
     */
    public function holidays()
    {
        return $this->hasMany(Holiday::class);
    }
} 