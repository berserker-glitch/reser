<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'user_id',
        'full_name',
        'phone',
        'note',
    ];

    /**
     * Get the user that owns the employee.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * The services that belong to the employee.
     */
    public function services()
    {
        return $this->belongsToMany(Service::class, 'employee_service');
    }

    /**
     * Get the working hours for the employee.
     */
    public function workingHours()
    {
        return $this->hasMany(WorkingHour::class);
    }

    /**
     * Get the reservations for the employee.
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
