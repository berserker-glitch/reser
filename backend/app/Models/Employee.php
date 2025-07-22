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
        'salon_id',
        'user_id',
        'full_name',
        'phone',
        'profile_picture',
        'note',
    ];

    /**
     * Get the salon that owns the employee.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

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
     * Get the reservations for the employee.
     */
    public function reservations()
    {
        return $this->hasMany(Reservation::class);
    }
}
