<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * UserSalon Model
 * 
 * Manages the association between users and salons
 * Stores when a user registered with a salon and their status
 */
class UserSalon extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'salon_id',
        'registered_at',
        'last_visit',
        'status',
    ];

    protected $casts = [
        'registered_at' => 'datetime',
        'last_visit' => 'datetime',
    ];

    /**
     * Get the user associated with this salon relationship
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the salon associated with this user relationship
     */
    public function salon(): BelongsTo
    {
        return $this->belongsTo(Salon::class);
    }

    /**
     * Scope to get only active associations
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'ACTIVE');
    }

    /**
     * Update last visit timestamp
     */
    public function updateLastVisit()
    {
        $this->update(['last_visit' => now()]);
    }

    /**
     * Mark association as inactive
     */
    public function deactivate()
    {
        $this->update(['status' => 'INACTIVE']);
    }

    /**
     * Mark association as active
     */
    public function activate()
    {
        $this->update(['status' => 'ACTIVE']);
    }
}
