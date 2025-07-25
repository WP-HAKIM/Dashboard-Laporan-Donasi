<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('transactions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('branch_id')->constrained('branches')->onDelete('cascade');
            $table->foreignId('team_id')->constrained('teams')->onDelete('cascade');
            $table->foreignId('volunteer_id')->constrained('users')->onDelete('cascade');
            $table->enum('program_type', ['ZISWAF', 'QURBAN']);
            $table->foreignId('program_id')->constrained('programs')->onDelete('cascade');
            $table->string('donor_name');
            $table->decimal('amount', 15, 2);
            $table->string('transfer_method');
            $table->string('proof_image')->nullable();
            $table->enum('status', ['pending', 'valid', 'double_duta', 'double_input', 'not_in_account', 'other'])->default('pending');
            $table->text('status_reason')->nullable();
            $table->timestamp('validated_at')->nullable();
            $table->foreignId('validated_by')->nullable()->constrained('users')->onDelete('set null');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('transactions');
    }
};
