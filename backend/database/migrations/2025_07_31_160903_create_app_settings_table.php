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
        Schema::create('app_settings', function (Blueprint $table) {
            $table->id();
            $table->string('app_title')->default('Dashboard Donasi');
            $table->string('logo_url')->nullable();
            $table->string('primary_color')->default('#2563eb');
            $table->string('secondary_color')->default('#1e40af');
            $table->string('background_color')->default('#ffffff');
            $table->string('text_color')->default('#1f2937');
            $table->string('sidebar_color')->default('#f8fafc');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('app_settings');
    }
};
