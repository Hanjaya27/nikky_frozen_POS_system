<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ProductController extends Controller
{
    public function index(Request $request)
    {
        $query = Product::with('branch:id,name,code')
            ->orderBy('id', 'desc');

        if ($request->filled('branch_id')) {
            $query->where('branch_id', $request->branch_id);
        }

        if ($request->filled('category')) {
            $query->where('category', $request->category);
        }

        if ($request->filled('search')) {
            $search = $request->search;

            $query->where(function ($item) use ($search) {
                $item->where('name', 'like', "%{$search}%")
                    ->orWhere('code', 'like', "%{$search}%");
            });
        }

        $products = $query->get();

        return response()->json([
            'success' => true,
            'message' => 'Data produk berhasil diambil.',
            'data' => $products,
        ]);
    }

    public function show($id)
    {
        $product = Product::with('branch:id,name,code')->find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'message' => 'Detail produk berhasil diambil.',
            'data' => $product,
        ]);
    }

    public function store(Request $request)
    {
        $validatedData = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'code' => ['required', 'string', 'max:50', 'unique:products,code'],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'stock' => ['required', 'integer', 'min:0'],
            'min_stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'expired_date' => ['nullable', 'date'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $validatedData['status'] = $validatedData['status'] ?? 'Aktif';

        $product = Product::create($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil ditambahkan.',
            'data' => $product->load('branch:id,name,code'),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $validatedData = $request->validate([
            'branch_id' => ['required', 'exists:branches,id'],
            'code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('products', 'code')->ignore($product->id),
            ],
            'name' => ['required', 'string', 'max:255'],
            'category' => ['required', 'string', 'max:100'],
            'stock' => ['required', 'integer', 'min:0'],
            'min_stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'expired_date' => ['nullable', 'date'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'string'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        $validatedData['status'] = $validatedData['status'] ?? 'Aktif';

        $product->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->load('branch:id,name,code'),
        ]);
    }

    public function destroy($id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }
}
