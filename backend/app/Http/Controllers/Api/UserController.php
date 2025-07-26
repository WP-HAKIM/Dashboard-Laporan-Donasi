<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = User::with(['branch', 'team']);
        
        // Filter by branch if provided
        if ($request->has('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }
        
        // Filter by team if provided
        if ($request->has('team_id')) {
            $query->where('team_id', $request->team_id);
        }
        
        // Filter by role if provided
        if ($request->has('role')) {
            $query->where('role', $request->role);
        }
        
        $users = $query->get();
        return response()->json($users);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'phone' => 'nullable|string|max:20',
            'password' => 'required|string|min:8',
            'role' => 'required|in:admin,validator,volunteer,branch',
            'branch_id' => 'nullable|exists:branches,id',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'branch_id' => $request->branch_id,
            'team_id' => $request->team_id,
        ]);

        return response()->json($user->load(['branch', 'team']), 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(User $user)
    {
        return response()->json($user->load(['branch', 'team']));
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, User $user)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                Rule::unique('users')->ignore($user->id),
            ],
            'phone' => 'nullable|string|max:20',
            'password' => 'nullable|string|min:8',
            'role' => 'required|in:admin,validator,volunteer,branch',
            'branch_id' => 'nullable|exists:branches,id',
            'team_id' => 'nullable|exists:teams,id',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'phone' => $request->phone,
            'role' => $request->role,
            'branch_id' => $request->branch_id,
            'team_id' => $request->team_id,
        ];

        // Only update password if provided
        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);
        return response()->json($user->load(['branch', 'team']));
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(User $user)
    {
        // Prevent deletion of the current authenticated user
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'Cannot delete your own account'
            ], 403);
        }

        $user->delete();
        return response()->json(['message' => 'User deleted successfully']);
    }

    /**
     * Get users by branch
     */
    public function getByBranch($branchId)
    {
        $users = User::with(['branch', 'team'])
            ->where('branch_id', $branchId)
            ->get();
            
        return response()->json($users);
    }

    /**
     * Get users by team
     */
    public function getByTeam($teamId)
    {
        $users = User::with(['branch', 'team'])
            ->where('team_id', $teamId)
            ->get();
            
        return response()->json($users);
    }
}