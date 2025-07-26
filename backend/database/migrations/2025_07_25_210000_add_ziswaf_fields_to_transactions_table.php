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
        Schema::table('transactions', function (Blueprint $table) {
            $table->foreignId('ziswaf_program_id')->nullable()->after('qurban_amount')->constrained('programs')->onDelete('set null');
            $table->decimal('ziswaf_amount', 15, 2)->nullable()->after('ziswaf_program_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropForeign(['ziswaf_program_id']);
            $table->dropColumn(['ziswaf_program_id', 'ziswaf_amount']);
        });
    }
};