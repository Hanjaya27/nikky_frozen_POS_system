<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use Illuminate\Http\Request;

class LoginActivityController extends Controller
{
    public function index(Request $request)
    {
        $query = LoginActivity::with([
            'user:id,name,username,role',
            'branch:id,name,code',
        ])->orderBy('id', 'desc');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('shift_name')) {
            $query->where('shift_name', $request->shift_name);
        }

        if ($request->filled('date')) {
            $query->whereDate('login_at', $request->date);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($item) use ($search) {
                $item->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('role', 'like', "%{$search}%")
                    ->orWhere('branch_name', 'like', "%{$search}%")
                    ->orWhere('shift_name', 'like', "%{$search}%")
                    ->orWhere('device', 'like', "%{$search}%");
            });
        }

        $activities = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Data aktivitas login berhasil diambil.',
            'data' => $activities,
        ]);
    }

    public function forceLogout($id)
    {
        $activity = LoginActivity::find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Data aktivitas login tidak ditemukan.',
            ], 404);
        }

        if ($activity->status === 'Logout') {
            return response()->json([
                'success' => false,
                'message' => 'Aktivitas ini sudah logout.',
            ], 422);
        }

        $activity->update([
            'logout_at' => now(),
            'status' => 'Logout',
            'note' => 'Force logout oleh owner',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil di-force logout.',
            'data' => $activity,
        ]);
    }

    public function destroy($id)
    {
        $activity = LoginActivity::find($id);

        if (!$activity) {
            return response()->json([
                'success' => false,
                'message' => 'Data aktivitas login tidak ditemukan.',
            ], 404);
        }

        $activity->delete();

        return response()->json([
            'success' => true,
            'message' => 'Data aktivitas login berhasil dihapus.',
        ]);
    }
}
