<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class WorkingHour extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'salon_id',
        'weekday',
        'start_time',
        'end_time',
        'break_start',
        'break_end',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'weekday' => 'integer',
        'start_time' => 'string',
        'end_time' => 'string',
        'break_start' => 'string',
        'break_end' => 'string',
    ];

    /**
     * Get the salon that owns the working hours.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }
}
