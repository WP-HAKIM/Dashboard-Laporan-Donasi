<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AppSetting extends Model
{
    protected $fillable = [
        'app_title',
        'logo_url',
        'favicon_url',
        'primary_color',
        'secondary_color',
        'background_color',
        'text_color',
        'sidebar_color',
    ];

    /**
     * Get the current app settings (singleton pattern)
     */
    public static function current()
    {
        $settings = self::first();
        
        if (!$settings) {
            $settings = self::create([
                'app_title' => 'Dashboard Donasi',
                'logo_url' => null,
                'favicon_url' => null,
                'primary_color' => '#2563eb',
                'secondary_color' => '#1e40af',
                'background_color' => '#ffffff',
                'text_color' => '#1f2937',
                'sidebar_color' => '#f8fafc',
            ]);
        }
        
        return $settings;
    }
}
