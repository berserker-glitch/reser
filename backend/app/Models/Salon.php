<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

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
     * Convert salon name to URL-friendly slug
     */
    public function getSlugAttribute(): string
    {
        return Str::slug($this->name);
    }

    /**
     * Get the route key for the model (use name instead of id)
     */
    public function getRouteKeyName(): string
    {
        return 'name';
    }

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

    /**
     * Get the users associated with this salon through UserSalon pivot
     */
    public function users()
    {
        return $this->belongsToMany(User::class, 'user_salons')
                    ->withPivot(['registered_at', 'last_visit', 'status'])
                    ->withTimestamps();
    }

    /**
     * Get active users (clients) of this salon
     */
    public function activeUsers()
    {
        return $this->users()->wherePivot('status', 'ACTIVE');
    }

    /**
     * Get the user-salon associations
     */
    public function userSalons()
    {
        return $this->hasMany(UserSalon::class);
    }
} 