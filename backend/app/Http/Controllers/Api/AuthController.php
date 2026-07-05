<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\LoginActivity;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $validatedData = $request->validate([
            'username' => ['required', 'string'],
            'password' => ['required', 'string'],
        ]);

        $user = User::with('branch:id,name,code')
            ->where('username', $validatedData['username'])
            ->first();

        if (!$user || !Hash::check($validatedData['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Username atau password salah.',
            ], 401);
        }

        if ($user->status !== 'Aktif') {
            return response()->json([
                'success' => false,
                'message' => 'Akun tidak aktif. Hubungi owner.',
            ], 403);
        }

        $user->update([
            'last_login_at' => now(),
        ]);

        $activity = LoginActivity::create([
            'user_id' => $user->id,
            'branch_id' => $user->branch_id,
            'name' => $user->name,
            'username' => $user->username,
            'role' => $user->role,
            'branch_name' => $user->branch?->name,
            'shift_name' => $user->shift_name,
            'login_at' => now(),
            'status' => 'Login',
            'ip_address' => $request->ip(),
            'user_agent' => $request->userAgent(),
            'device' => $this->detectDevice($request->userAgent()),
            'note' => 'Login Berhasil',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Login berhasil.',
            'data' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'username' => $user->username,
                    'email' => $user->email,
                    'role' => $user->role,
                    'branch_id' => $user->branch_id,
                    'branch' => $user->branch?->name,
                    'branch_code' => $user->branch?->code,
                    'shift' => $user->shift_name,
                    'phone' => $user->phone,
                    'status' => $user->status,
                    'last_login_at' => $user->last_login_at,
                ],
                'login_activity_id' => $activity->id,
            ],
        ]);
    }

    public function logout(Request $request)
    {
        $validatedData = $request->validate([
            'username' => ['required', 'string'],
            'login_activity_id' => ['nullable', 'integer'],
        ]);

        $query = LoginActivity::where('username', $validatedData['username'])
            ->where('status', 'Login');

        if (!empty($validatedData['login_activity_id'])) {
            $query->where('id', $validatedData['login_activity_id']);
        }

        $activity = $query->latest('id')->first();

        if ($activity) {
            $activity->update([
                'logout_at' => now(),
                'status' => 'Logout',
                'note' => 'Logout Berhasil',
            ]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Logout berhasil.',
            'data' => $activity,
        ]);
    }

    private function detectDevice($userAgent)
    {
        if (!$userAgent) {
            return 'Unknown Device';
        }

        $browser = 'Browser';
        $os = 'Device';

        if (str_contains($userAgent, 'Chrome')) {
            $browser = 'Chrome';
        } elseif (str_contains($userAgent, 'Firefox')) {
            $browser = 'Firefox';
        } elseif (str_contains($userAgent, 'Safari')) {
            $browser = 'Safari';
        } elseif (str_contains($userAgent, 'Edge')) {
            $browser = 'Edge';
        }

        if (str_contains($userAgent, 'Windows')) {
            $os = 'Windows';
        } elseif (str_contains($userAgent, 'Macintosh')) {
            $os = 'MacOS';
        } elseif (str_contains($userAgent, 'Android')) {
            $os = 'Android';
        } elseif (str_contains($userAgent, 'iPhone')) {
            $os = 'iPhone';
        } elseif (str_contains($userAgent, 'Linux')) {
            $os = 'Linux';
        }

        return "{$browser} - {$os}";
    }
}
