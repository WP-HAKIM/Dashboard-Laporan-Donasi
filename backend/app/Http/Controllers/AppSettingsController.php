<?php

namespace App\Http\Controllers;

use App\Models\AppSetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

class AppSettingsController extends Controller
{
    /**
     * Get current app settings
     */
    public function show(): JsonResponse
    {
        $settings = AppSetting::current();
        
        return response()->json([
            'success' => true,
            'data' => $settings
        ]);
    }

    /**
     * Update app settings (Admin only)
     */
    public function update(Request $request): JsonResponse
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admin can update app settings.'
            ], 403);
        }

        $validated = $request->validate([
            'app_title' => 'required|string|max:255',
            'logo_url' => 'nullable|url|max:500',
            'primary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'secondary_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'background_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'text_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
            'sidebar_color' => 'required|string|regex:/^#[0-9A-Fa-f]{6}$/',
        ]);

        $settings = AppSetting::current();
        $settings->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'App settings updated successfully',
            'data' => $settings
        ]);
    }

    /**
     * Upload logo file (Admin only)
     */
    public function uploadLogo(Request $request): JsonResponse
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admin can upload logo.'
            ], 403);
        }

        $request->validate([
            'logo' => 'required|image|mimes:jpeg,png,jpg,gif|max:2048', // 2MB max
        ]);

        try {
            // Delete old logo if exists
            $settings = AppSetting::current();
            if ($settings->logo_url) {
                // Extract filename from URL if it's a local file
                $oldPath = str_replace(url('/storage/'), '', $settings->logo_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Store new logo
            $logoPath = $request->file('logo')->store('logos', 'public');
            $logoUrl = url('/storage/' . $logoPath);

            // Update settings with new logo URL
            $settings->update(['logo_url' => $logoUrl]);

            return response()->json([
                'success' => true,
                'message' => 'Logo uploaded successfully',
                'data' => [
                    'logo_url' => $logoUrl,
                    'settings' => $settings
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload logo: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Upload favicon file (Admin only)
     */
    public function uploadFavicon(Request $request): JsonResponse
    {
        // Check if user is admin
        if (auth()->user()->role !== 'admin') {
            return response()->json([
                'success' => false,
                'message' => 'Unauthorized. Only admin can upload favicon.'
            ], 403);
        }

        $request->validate([
            'favicon' => 'required|image|mimes:jpeg,png,jpg,gif,ico|max:1024', // 1MB max for favicon
        ]);

        try {
            // Delete old favicon if exists
            $settings = AppSetting::current();
            if ($settings->favicon_url) {
                // Extract filename from URL if it's a local file
                $oldPath = str_replace(url('/storage/'), '', $settings->favicon_url);
                if (Storage::disk('public')->exists($oldPath)) {
                    Storage::disk('public')->delete($oldPath);
                }
            }

            // Store new favicon
            $faviconPath = $request->file('favicon')->store('favicons', 'public');
            $faviconUrl = url('/storage/' . $faviconPath);

            // Update settings with new favicon URL
            $settings->update(['favicon_url' => $faviconUrl]);

            return response()->json([
                'success' => true,
                'message' => 'Favicon uploaded successfully',
                'data' => [
                    'favicon_url' => $faviconUrl,
                    'settings' => $settings
                ]
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to upload favicon: ' . $e->getMessage()
            ], 500);
        }
    }
}
