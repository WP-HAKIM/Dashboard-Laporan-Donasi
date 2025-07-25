<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Program extends Model
{
    protected $fillable = [
        'type',
        'name',
        'code',
        'description',
        'volunteer_rate',
        'branch_rate'
    ];

    protected $casts = [
        'volunteer_rate' => 'decimal:2',
        'branch_rate' => 'decimal:2'
    ];

    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class);
    }
}
