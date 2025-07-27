<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentMethod extends Model
{
    protected $fillable = [
        'name',
        'description',
        'is_active'
    ];

    protected $casts = [
        'is_active' => 'boolean'
    ];

    /**
     * Get the transactions for the payment method.
     */
    public function transactions(): HasMany
    {
        return $this->hasMany(Transaction::class, 'transfer_method', 'name');
    }
}
