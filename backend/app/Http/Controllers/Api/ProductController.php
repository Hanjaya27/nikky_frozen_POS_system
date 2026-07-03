<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Storage;

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
            'store_stock' => ['required', 'integer', 'min:0'],
            'warehouse_stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'expired_date' => ['nullable', 'date'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        if ($request->hasFile('image')) {
            $path = $request->file('image')->store('products', 'public');
            $validatedData['image'] = $path;
        }

        $validatedData['status'] = $validatedData['status'] ?? 'Aktif';
        $validatedData['stock'] = $validatedData['store_stock'] + $validatedData['warehouse_stock'];
        $validatedData['min_stock'] = 0; 

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

        // Pastikan hanya bisa mengedit produk cabangnya sendiri
        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk mengubah data cabang lain.',
            ], 403);
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
            'store_stock' => ['required', 'integer', 'min:0'],
            'warehouse_stock' => ['required', 'integer', 'min:0'],
            'price' => ['required', 'integer', 'min:0'],
            'expired_date' => ['nullable', 'date'],
            'storage_location' => ['nullable', 'string', 'max:100'],
            'image' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'status' => ['nullable', 'string', 'max:50'],
        ]);

        if ($request->hasFile('image')) {
            if ($product->image) {
                Storage::disk('public')->delete($product->image);
            }
            $path = $request->file('image')->store('products', 'public');
            $validatedData['image'] = $path;
        }

        $validatedData['status'] = $validatedData['status'] ?? 'Aktif';
        $validatedData['stock'] = $validatedData['store_stock'] + $validatedData['warehouse_stock'];

        $product->update($validatedData);

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil diperbarui.',
            'data' => $product->load('branch:id,name,code'),
        ]);
    }

    public function destroy(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk menghapus data cabang lain.',
            ], 403);
        }

        if ($product->image) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produk berhasil dihapus.',
        ]);
    }

    public function mutateStock(Request $request, $id)
    {
        $product = Product::find($id);

        if (!$product) {
            return response()->json([
                'success' => false,
                'message' => 'Produk tidak ditemukan.',
            ], 404);
        }

        if ($request->filled('branch_id') && $product->branch_id != $request->branch_id) {
            return response()->json([
                'success' => false,
                'message' => 'Anda tidak memiliki akses untuk memutasi stok cabang lain.',
            ], 403);
        }

        $validatedData = $request->validate([
            'amount' => ['required', 'integer', 'min:1'],
        ]);

        $amount = $validatedData['amount'];

        if ($product->warehouse_stock < $amount) {
            return response()->json([
                'success' => false,
                'message' => 'Stok gudang tidak mencukupi untuk mutasi sejumlah ' . $amount,
            ], 422);
        }

        $product->warehouse_stock -= $amount;
        $product->store_stock += $amount;
        $product->stock = $product->store_stock + $product->warehouse_stock;
        
        $product->save();

        return response()->json([
            'success' => true,
            'message' => "Mutasi stok sebesar {$amount} berhasil dipindahkan ke toko.",
            'data' => $product,
        ]);
    }
}
