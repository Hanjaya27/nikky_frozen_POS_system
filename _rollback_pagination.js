const fs = require('fs');
const root = 'C:\\laragon\\www\\possystem';

function patchFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const [from, to] of replacements) {
    content = content.replace(from, to);
  }
  fs.writeFileSync(path, content, 'utf8');
}

patchFile(root + '\\backend\\app\\Http\\Controllers\\Api\\ProductController.php', [
  [/$perPage = \$request->query\('per_page', 10\);\s*\$products = \$query->paginate\(\$perPage\);/m, '$products = $query->get();'],
  [/\s*'data' => \[\s*'current_page' => \$products->currentPage\(\),\s*'data' => \$products->items\(\),\s*'first_page_url' => \$products->url\(1\),\s*'from' => \$products->firstItem\(\),\s*'last_page' => \$products->lastPage\(\),\s*'last_page_url' => \$products->url\(\$products->lastPage\(\)\),\s*'next_page_url' => \$products->nextPageUrl\(\),\s*'path' => \$products->path\(\),\s*'per_page' => \$products->perPage\(\),\s*'prev_page_url' => \$products->previousPageUrl\(\),\s*'to' => \$products->lastItem\(\),\s*'total' => \$products->total\(\),\s*\],/m, "\n            'data' => $products,"]
]);

patchFile(root + '\\backend\\app\\Http\\Controllers\\Api\\TransactionController.php', [
  [/$perPage = \$request->query\('per_page', 10\);\s*\$transactions = \$query->paginate\(\$perPage\);/m, '$transactions = $query->get();'],
  [/\s*'transactions' => \[\s*'current_page' => \$transactions->currentPage\(\),\s*'data' => \$transactions->items\(\),\s*'first_page_url' => \$transactions->url\(1\),\s*'from' => \$transactions->firstItem\(\),\s*'last_page' => \$transactions->lastPage\(\),\s*'last_page_url' => \$transactions->url\(\$transactions->lastPage\(\)\),\s*'next_page_url' => \$transactions->nextPageUrl\(\),\s*'path' => \$transactions->path\(\),\s*'per_page' => \$transactions->perPage\(\),\s*'prev_page_url' => \$transactions->previousPageUrl\(\),\s*'to' => \$transactions->lastItem\(\),\s*'total' => \$transactions->total\(\),\s*\],/m, "\n                'transactions' => $transactions,"]
]);

patchFile(root + '\\backend\\app\\Http\\Controllers\\Api\\ExpenseController.php', [
  [/$perPage = \$request->query\('per_page', 10\);\s*\$expenses = \$query->paginate\(\$perPage\);/m, '$expenses = $query->get();'],
  [/\s*'data' => \[\s*'current_page' => \$expenses->currentPage\(\),\s*'data' => \$expenses->items\(\),\s*'first_page_url' => \$expenses->url\(1\),\s*'from' => \$expenses->firstItem\(\),\s*'last_page' => \$expenses->lastPage\(\),\s*'last_page_url' => \$expenses->url\(\$expenses->lastPage\(\)\),\s*'next_page_url' => \$expenses->nextPageUrl\(\),\s*'path' => \$expenses->path\(\),\s*'per_page' => \$expenses->perPage\(\),\s*'prev_page_url' => \$expenses->previousPageUrl\(\),\s*'to' => \$expenses->lastItem\(\),\s*'total' => \$expenses->total\(\),\s*\],/m, "\n            'data' => $expenses,"]
]);

patchFile(root + '\\backend\\app\\Http\\Controllers\\Api\\UserController.php', [
  [/$perPage = \$request->query\('per_page', 10\);\s*\$users = \$query->paginate\(\$perPage\);/m, '$users = $query->get();'],
  [/\s*'data' => \[\s*'current_page' => \$users->currentPage\(\),\s*'data' => \$users->items\(\),\s*'first_page_url' => \$users->url\(1\),\s*'from' => \$users->firstItem\(\),\s*'last_page' => \$users->lastPage\(\),\s*'last_page_url' => \$users->url\(\$users->lastPage\(\)\),\s*'next_page_url' => \$users->nextPageUrl\(\),\s*'path' => \$users->path\(\),\s*'per_page' => \$users->perPage\(\),\s*'prev_page_url' => \$users->previousPageUrl\(\),\s*'to' => \$users->lastItem\(\),\s*'total' => \$users->total\(\),\s*\],/m, "\n            'data' => $users,"]
]);

console.log('backend response format rolled back to arrays');
