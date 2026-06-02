<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingController extends Controller
{
    private function defaultStoreProfile()
    {
        return [
            'storeName' => 'Nikky Frozen',
            'address' => 'Klaten, Jawa Tengah',
            'phone' => '0272-000000',
            'whatsapp' => '081234567890',
            'npwp' => '',
            'logoName' => '',
        ];
    }

    private function defaultReceiptSetting()
    {
        return [
            'ppnActive' => true,
            'ppnRate' => 11,
            'maxDiscount' => 10,
            'roundingType' => 'Tidak ada pembulatan',
            'invoiceFormat' => 'INV-{YYYY}{MM}{DD}-{0000}',
            'resetNumber' => 'Reset setiap hari',
            'paperSize' => 'Thermal 80mm',
            'margin' => 5,
            'autoPrint' => true,
            'showCashierName' => true,
            'showBranchName' => true,
            'footerNote' => 'Terima kasih telah berbelanja di Nikky Frozen.',
        ];
    }

    private function syncDefaultSettings()
    {
        Setting::firstOrCreate(
            ['key' => 'store_profile'],
            ['value' => $this->defaultStoreProfile()]
        );

        Setting::firstOrCreate(
            ['key' => 'receipt_setting'],
            ['value' => $this->defaultReceiptSetting()]
        );
    }

    public function index()
    {
        $this->syncDefaultSettings();

        $storeProfile = Setting::where('key', 'store_profile')->first();
        $receiptSetting = Setting::where('key', 'receipt_setting')->first();

        return response()->json([
            'success' => true,
            'message' => 'Data pengaturan berhasil diambil.',
            'data' => [
                'store_profile' => array_merge(
                    $this->defaultStoreProfile(),
                    $storeProfile?->value ?? []
                ),
                'receipt_setting' => array_merge(
                    $this->defaultReceiptSetting(),
                    $receiptSetting?->value ?? []
                ),
            ],
        ]);
    }

    public function update(Request $request)
    {
        $validatedData = $request->validate([
            'store_profile' => ['required', 'array'],
            'store_profile.storeName' => ['required', 'string', 'max:255'],
            'store_profile.address' => ['required', 'string'],
            'store_profile.phone' => ['required', 'string', 'max:50'],
            'store_profile.whatsapp' => ['nullable', 'string', 'max:50'],
            'store_profile.npwp' => ['nullable', 'string', 'max:100'],
            'store_profile.logoName' => ['nullable', 'string', 'max:255'],

            'receipt_setting' => ['required', 'array'],
            'receipt_setting.ppnActive' => ['required', 'boolean'],
            'receipt_setting.ppnRate' => ['required', 'numeric', 'min:0'],
            'receipt_setting.maxDiscount' => ['required', 'numeric', 'min:0'],
            'receipt_setting.roundingType' => ['required', 'string', 'max:100'],
            'receipt_setting.invoiceFormat' => ['required', 'string', 'max:100'],
            'receipt_setting.resetNumber' => ['required', 'string', 'max:100'],
            'receipt_setting.paperSize' => ['required', 'string', 'max:100'],
            'receipt_setting.margin' => ['required', 'numeric', 'min:0'],
            'receipt_setting.autoPrint' => ['required', 'boolean'],
            'receipt_setting.showCashierName' => ['required', 'boolean'],
            'receipt_setting.showBranchName' => ['required', 'boolean'],
            'receipt_setting.footerNote' => ['nullable', 'string'],
        ]);

        $storeProfile = array_merge(
            $this->defaultStoreProfile(),
            $validatedData['store_profile']
        );

        $receiptSetting = array_merge(
            $this->defaultReceiptSetting(),
            $validatedData['receipt_setting']
        );

        Setting::updateOrCreate(
            ['key' => 'store_profile'],
            ['value' => $storeProfile]
        );

        Setting::updateOrCreate(
            ['key' => 'receipt_setting'],
            ['value' => $receiptSetting]
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil diperbarui.',
            'data' => [
                'store_profile' => $storeProfile,
                'receipt_setting' => $receiptSetting,
            ],
        ]);
    }

    public function reset()
    {
        Setting::updateOrCreate(
            ['key' => 'store_profile'],
            ['value' => $this->defaultStoreProfile()]
        );

        Setting::updateOrCreate(
            ['key' => 'receipt_setting'],
            ['value' => $this->defaultReceiptSetting()]
        );

        return response()->json([
            'success' => true,
            'message' => 'Pengaturan berhasil direset.',
            'data' => [
                'store_profile' => $this->defaultStoreProfile(),
                'receipt_setting' => $this->defaultReceiptSetting(),
            ],
        ]);
    }
}
