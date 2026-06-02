<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends Controller
{
    public function index(Request $request)
    {
        $query = User::with('branch:id,name,code')
            ->orderBy('id', 'desc');

        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($item) use ($search) {
                $item->where('name', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('phone', 'like', "%{$search}%");
            });
        }

        $users = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Data user berhasil diambil.',
            'data' => $users,
        ]);
    }

    public function show($id)
    {
        $user = User::with('branch:id,name,code')->find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data user tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail user berhasil diambil.',
            'data' => $user,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:100', 'unique:users,username'],
            'email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6'],
            'role' => ['required', Rule::in(['owner', 'kasir'])],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'shift_name' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif'])],
        ]);

        if ($validatedData['role'] === 'kasir' && empty($validatedData['branch_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cabang wajib dipilih untuk user kasir.',
            ], 422);
        }

        if (empty($validatedData['email'])) {
            $validatedData['email'] = $validatedData['username'] . '@nikkyfrozen.test';
        }

        $validatedData['password'] = Hash::make($validatedData['password']);

        $user = User::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil ditambahkan.',
            'data' => $user->load('branch:id,name,code'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data user tidak ditemukan.',
            ], 404);
        }

        $validatedData = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'username' => [
                'required',
                'string',
                'max:100',
                Rule::unique('users', 'username')->ignore($user->id),
            ],
            'email' => [
                'nullable',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'password' => ['nullable', 'string', 'min:6'],
            'role' => ['required', Rule::in(['owner', 'kasir'])],
            'branch_id' => ['nullable', 'exists:branches,id'],
            'shift_name' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:30'],
            'status' => ['required', Rule::in(['Aktif', 'Nonaktif'])],
        ]);

        if ($validatedData['role'] === 'kasir' && empty($validatedData['branch_id'])) {
            return response()->json([
                'success' => false,
                'message' => 'Cabang wajib dipilih untuk user kasir.',
            ], 422);
        }

        if (empty($validatedData['email'])) {
            $validatedData['email'] = $validatedData['username'] . '@nikkyfrozen.test';
        }

        if (!empty($validatedData['password'])) {
            $validatedData['password'] = Hash::make($validatedData['password']);
        } else {
            unset($validatedData['password']);
        }

        $user->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'User berhasil diperbarui.',
            'data' => $user->load('branch:id,name,code'),
        ]);
    }

    public function destroy($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Data user tidak ditemukan.',
            ], 404);
        }

        if ($user->role === 'owner') {
            return response()->json([
                'success' => false,
                'message' => 'Akun owner tidak boleh dihapus.',
            ], 422);
        }

        $user->delete();

        return response()->json([
            'success' => true,
            'message' => 'User berhasil dihapus.',
        ]);
    }
}
