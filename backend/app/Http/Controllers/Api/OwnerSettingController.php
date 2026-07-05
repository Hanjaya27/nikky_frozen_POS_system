<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Branch;
use App\Models\RolePermission;
use App\Models\Setting;
use Illuminate\Http\Request;

class OwnerSettingController extends Controller
{
    private function defaults(): array
    {
        $branch = Branch::orderBy('id')->first();

        return [
            'profile' => [
                'store_name' => 'Nikky Frozen Food',
                'owner_name' => 'Owner',
                'active_branch_id' => $branch?->id,
                'active_branch_name' => $branch?->name ?? 'Cabang 1',
                'phone' => '08xxxxxxxxxx',
                'address' => 'Alamat toko belum diatur',
            ],
            'cashier_access' => [
                'enabled_menu_count' => 0,
                'allow_discount' => false,
                'allow_manual_price' => false,
                'allow_cancel_transaction' => false,
                'allow_view_stock' => true,
            ],
            'stock_expired' => [
                'low_stock_threshold' => 5,
                'expired_warning_days' => 30,
                'show_expired_alert' => true,
                'block_expired_sale' => true,
                'allow_negative_stock' => false,
            ],
            'transaction' => [
                'auto_print_receipt' => false,
                'require_shift_open' => true,
                'allow_cash_payment' => true,
                'allow_qris_payment' => true,
                'allow_transfer_payment' => true,
                'payment_methods' => ['cash', 'qris', 'transfer'],
            ],
            'receipt' => [
                'store_header' => 'Nikky Frozen Food',
                'footer_note' => 'Terima kasih',
                'show_cashier_name' => true,
                'show_branch_name' => true,
                'show_phone' => true,
                'show_address' => true,
            ],
        ];
    }

    private function getSetting(string $key, $default)
    {
        return Setting::where('key', $key)->first()?->value ?? $default;
    }

    private function putSetting(string $key, $value): void
    {
        Setting::updateOrCreate(['key' => $key], ['value' => $value]);
    }

    private function buildData(): array
    {
        $defaults = $this->defaults();

        $profile = array_merge($defaults['profile'], $this->getSetting('owner_profile', []));
        $cashierAccess = array_merge($defaults['cashier_access'], $this->getSetting('owner_cashier_access', []));
        $stockExpired = array_merge($defaults['stock_expired'], $this->getSetting('owner_stock_expired', []));
        $transaction = array_merge($defaults['transaction'], $this->getSetting('owner_transaction', []));
        $receipt = array_merge($defaults['receipt'], $this->getSetting('owner_receipt', []));

        $activeBranch = Branch::find($profile['active_branch_id'] ?? null) ?? Branch::orderBy('id')->first();
        $profile['active_branch_id'] = $activeBranch?->id;
        $profile['active_branch_name'] = $activeBranch?->name ?? $profile['active_branch_name'];

        $paymentMethods = array_values(array_filter($transaction['payment_methods'] ?? []));
        $transaction['payment_methods'] = $paymentMethods;
        $transaction['allow_cash_payment'] = in_array('cash', $paymentMethods, true);
        $transaction['allow_qris_payment'] = in_array('qris', $paymentMethods, true);
        $transaction['allow_transfer_payment'] = in_array('transfer', $paymentMethods, true);

        $enabledMenuCount = RolePermission::where('kasir_access', true)->count();
        $cashierAccess['enabled_menu_count'] = $enabledMenuCount;

        $branches = Branch::orderBy('id')->get()->map(fn ($branch) => [
            'id' => $branch->id,
            'name' => $branch->name,
            'phone' => $branch->phone,
            'address' => $branch->address,
            'status' => strtolower((string) $branch->status) === 'aktif' ? 'active' : $branch->status,
        ])->values();

        return [
            'profile' => $profile,
            'cashier_access' => $cashierAccess,
            'stock_expired' => $stockExpired,
            'transaction' => $transaction,
            'receipt' => $receipt,
            'summary' => [
                'store_profile_name' => $profile['store_name'],
                'cashier_enabled_menus' => $enabledMenuCount,
                'expired_warning_days' => (int) $stockExpired['expired_warning_days'],
                'active_payment_methods' => count($paymentMethods),
            ],
            'branches' => $branches,
        ];
    }

    public function index(Request $request)
    {
        try {
            return response()->json(['success' => true, 'data' => $this->buildData()]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal mengambil pengaturan.', 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }

    public function update(Request $request)
    {
        try {
            $profile = $request->input('profile', []);
            $cashierAccess = $request->input('cashier_access', []);
            $stockExpired = $request->input('stock_expired', []);
            $transaction = $request->input('transaction', []);
            $receipt = $request->input('receipt', []);

            $rules = [
                'profile' => ['required', 'array'],
                'profile.store_name' => ['required', 'string', 'max:255'],
                'profile.owner_name' => ['nullable', 'string', 'max:255'],
                'profile.phone' => ['nullable', 'string', 'max:50'],
                'profile.address' => ['nullable', 'string'],
                'profile.active_branch_id' => ['nullable', 'exists:branches,id'],
                'cashier_access.allow_discount' => ['nullable', 'boolean'],
                'cashier_access.allow_manual_price' => ['nullable', 'boolean'],
                'cashier_access.allow_cancel_transaction' => ['nullable', 'boolean'],
                'cashier_access.allow_view_stock' => ['nullable', 'boolean'],
                'stock_expired' => ['required', 'array'],
                'stock_expired.low_stock_threshold' => ['required', 'integer', 'min:0'],
                'stock_expired.expired_warning_days' => ['required', 'integer', 'min:1', 'max:365'],
                'stock_expired.show_expired_alert' => ['nullable', 'boolean'],
                'stock_expired.block_expired_sale' => ['nullable', 'boolean'],
                'stock_expired.allow_negative_stock' => ['nullable', 'boolean'],
                'transaction' => ['required', 'array'],
                'transaction.auto_print_receipt' => ['nullable', 'boolean'],
                'transaction.require_shift_open' => ['nullable', 'boolean'],
                'transaction.payment_methods' => ['required', 'array', 'min:1'],
                'transaction.payment_methods.*' => ['string', 'in:cash,qris,transfer'],
                'receipt' => ['nullable', 'array'],
                'receipt.store_header' => ['nullable', 'string', 'max:255'],
                'receipt.footer_note' => ['nullable', 'string'],
                'receipt.show_cashier_name' => ['nullable', 'boolean'],
                'receipt.show_branch_name' => ['nullable', 'boolean'],
                'receipt.show_phone' => ['nullable', 'boolean'],
                'receipt.show_address' => ['nullable', 'boolean'],
            ];

            $validator = \Illuminate\Support\Facades\Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json(['success' => false, 'message' => 'Validasi gagal.', 'errors' => $validator->errors()->toArray()], 422);
            }

            $validated = $validator->validated();

            $defaults = $this->defaults();

            $this->putSetting('owner_profile', array_merge($defaults['profile'], $validated['profile']));
            $this->putSetting('owner_cashier_access', array_merge($defaults['cashier_access'], $cashierAccess));
            $this->putSetting('owner_stock_expired', array_merge($defaults['stock_expired'], $validated['stock_expired']));
            $this->putSetting('owner_transaction', array_merge($defaults['transaction'], $validated['transaction']));
            $this->putSetting('owner_receipt', array_merge($defaults['receipt'], $receipt));

            return response()->json(['success' => true, 'message' => 'Pengaturan berhasil disimpan.', 'data' => $this->buildData()]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Gagal menyimpan pengaturan.', 'error' => config('app.debug') ? $e->getMessage() : null], 500);
        }
    }
}
