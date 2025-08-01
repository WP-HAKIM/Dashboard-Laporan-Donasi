<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Transaction extends Model
{
    protected $fillable = [
        'branch_id',
        'team_id',
        'volunteer_id',
        'program_type',
        'program_id',
        'donor_name',
        'qurban_owner_name',
        'qurban_amount',
        'ziswaf_program_id',
        'amount',
        'transaction_date',
        'volunteer_rate',
        'branch_rate',
        'ziswaf_volunteer_rate',
        'ziswaf_branch_rate',
        'payment_method_id',
        'proof_image',
        'status',
        'status_reason',
        'validated_at',
        'validated_by'
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'qurban_amount' => 'decimal:2',
        'transaction_date' => 'datetime',
        'volunteer_rate' => 'decimal:2',
        'branch_rate' => 'decimal:2',
        'ziswaf_volunteer_rate' => 'decimal:2',
        'ziswaf_branch_rate' => 'decimal:2',
        'validated_at' => 'datetime'
    ];

    protected $appends = ['donorName', 'transferMethod', 'transactionDate'];

    // Accessor untuk donorName (camelCase)
    public function getDonorNameAttribute()
    {
        return $this->attributes['donor_name'] ?? null;
    }

    // Accessor untuk transferMethod (camelCase)
    public function getTransferMethodAttribute()
    {
        return $this->paymentMethod ? $this->paymentMethod->name : null;
    }

    // Accessor untuk transactionDate (camelCase)
    public function getTransactionDateAttribute()
    {
        if (!isset($this->attributes['transaction_date'])) {
            return null;
        }
        
        // Return as ISO string with timezone to ensure consistent frontend handling
        return $this->attributes['transaction_date'] ? \Carbon\Carbon::parse($this->attributes['transaction_date'])->toISOString() : null;
    }

    public function branch(): BelongsTo
    {
        return $this->belongsTo(Branch::class);
    }

    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function volunteer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'volunteer_id');
    }

    public function program(): BelongsTo
    {
        return $this->belongsTo(Program::class);
    }

    public function ziswafProgram(): BelongsTo
    {
        return $this->belongsTo(Program::class, 'ziswaf_program_id');
    }

    public function validator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'validated_by');
    }

    public function paymentMethod(): BelongsTo
    {
        return $this->belongsTo(PaymentMethod::class);
    }

    /**
     * Boot the model and add event listeners
     */
    protected static function boot()
    {
        parent::boot();

        // Add event listener for deleting transactions
        static::deleting(function ($transaction) {
            // Delete associated proof image file when transaction is deleted
            if ($transaction->proof_image) {
                Storage::disk('public')->delete($transaction->proof_image);
            }
        });
    }
}
