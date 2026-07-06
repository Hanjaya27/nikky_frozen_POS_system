const fs = require('fs');
const root = 'C:\\laragon\\www\\possystem';

function write(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}

function patchProductController() {
  const path = root + '\\backend\\app\\Http\\Controllers\\Api\\ProductController.php';
  let s = fs.readFileSync(path, 'utf8');

  s = s.replace(
    '$products = $query->get();',
    '$perPage = $request->query(\'per_page\', 10);\n        $products = $query->paginate($perPage);'
  );

  s = s.replace(
    "'data' => $products,",
    `'data' => [
            'current_page' => $products->currentPage(),
            'data' => $products->items(),
            'first_page_url' => $products->url(1),
            'from' => $products->firstItem(),
            'last_page' => $products->lastPage(),
            'last_page_url' => $products->url($products->lastPage()),
            'next_page_url' => $products->nextPageUrl(),
            'path' => $products->path(),
            'per_page' => $products->perPage(),
            'prev_page_url' => $products->previousPageUrl(),
            'to' => $products->lastItem(),
            'total' => $products->total(),
        ],`
  );
  write(path, s);
}

function patchTransactionController() {
  const path = root + '\\backend\\app\\Http\\Controllers\\Api\\TransactionController.php';
  let s = fs.readFileSync(path, 'utf8');

  s = s.replace(
    '$transactions = $query->get();',
    '$perPage = $request->query(\'per_page\', 10);\n        $transactions = $query->paginate($perPage);'
  );

  s = s.replace(
    "'transactions' => $transactions,",
    `'transactions' => [
                    'current_page' => $transactions->currentPage(),
                    'data' => $transactions->items(),
                    'first_page_url' => $transactions->url(1),
                    'from' => $transactions->firstItem(),
                    'last_page' => $transactions->lastPage(),
                    'last_page_url' => $transactions->url($transactions->lastPage()),
                    'next_page_url' => $transactions->nextPageUrl(),
                    'path' => $transactions->path(),
                    'per_page' => $transactions->perPage(),
                    'prev_page_url' => $transactions->previousPageUrl(),
                    'to' => $transactions->lastItem(),
                    'total' => $transactions->total(),
                ],`
  );
  write(path, s);
}

function patchExpenseController() {
  const path = root + '\\backend\\app\\Http\\Controllers\\Api\\ExpenseController.php';
  let s = fs.readFileSync(path, 'utf8');

  s = s.replace(
    '$expenses = $query->get();',
    '$perPage = $request->query(\'per_page\', 10);\n        $expenses = $query->paginate($perPage);'
  );

  s = s.replace(
    "'data' => $expenses,",
    `'data' => [
            'current_page' => $expenses->currentPage(),
            'data' => $expenses->items(),
            'first_page_url' => $expenses->url(1),
            'from' => $expenses->firstItem(),
            'last_page' => $expenses->lastPage(),
            'last_page_url' => $expenses->url($expenses->lastPage()),
            'next_page_url' => $expenses->nextPageUrl(),
            'path' => $expenses->path(),
            'per_page' => $expenses->perPage(),
            'prev_page_url' => $expenses->previousPageUrl(),
            'to' => $expenses->lastItem(),
            'total' => $expenses->total(),
        ],`
  );
  write(path, s);
}

function patchUserController() {
  const path = root + '\\backend\\app\\Http\\Controllers\\Api\\UserController.php';
  let s = fs.readFileSync(path, 'utf8');

  s = s.replace(
    '$users = $query->get();',
    '$perPage = $request->query(\'per_page\', 10);\n        $users = $query->paginate($perPage);'
  );

  s = s.replace(
    "'data' => $users,",
    `'data' => [
            'current_page' => $users->currentPage(),
            'data' => $users->items(),
            'first_page_url' => $users->url(1),
            'from' => $users->firstItem(),
            'last_page' => $users->lastPage(),
            'last_page_url' => $users->url($users->lastPage()),
            'next_page_url' => $users->nextPageUrl(),
            'path' => $users->path(),
            'per_page' => $users->perPage(),
            'prev_page_url' => $users->previousPageUrl(),
            'to' => $users->lastItem(),
            'total' => $users->total(),
        ],`
  );
  write(path, s);
}

patchProductController();
patchTransactionController();
patchExpenseController();
patchUserController();
console.log("Backend pagination patch applied");
