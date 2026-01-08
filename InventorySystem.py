from warnings import catch_warnings
import os
from dotenv import load_dotenv
from flask import Flask, json, render_template, request, jsonify
from flask_cors import CORS
import pyodbc

app = Flask(__name__)
CORS(app)

load_dotenv()

def connection():
    password = os.getenv('DB_PASSWORD')
    driver_path = '/opt/microsoft/msodbcsql17/lib64/libmsodbcsql-17.10.so.1.1'
    conn_str = (
        f'DRIVER={{{driver_path}}};'
        'SERVER=servidor-yeilen.database.windows.net;'
        'DATABASE=InventoryDB;'
        'UID=yeilen-ramos;'
        f'PWD={password};'
        'Encrypt=yes;'
        'TrustServerCertificate=no;'
        'Connection Timeout=30;'
    )
    return pyodbc.connect(conn_str)

@app.route('/')
def home():
    return render_template('inventorySystem.html')


@app.get('/listProducts')
def GetListProducts():
    conn = connection()
    cursor = conn.cursor()

    cursor.execute("""
            SELECT p.product_id,
                   p.product_name,
                   c.category_name,
                   p.stock,
                   p.price
            FROM inventory.products p
            JOIN inventory.category c
            ON c.category_id = p.category_id
        """)
    rows = cursor.fetchall()
    


    products = []

    for row in rows:
        products.append({
            'product_id': row[0],
            'product_name': row[1],
            'category_name': row[2],
            'stock': row[3],
            'price': row[4]
        })

    cursor.close()
    conn.close()
    return jsonify(products)


@app.get('/totalProducts')
def totalProducts():
    conn = connection()
    cursor = conn.cursor()

    cursor.execute("""
            WITH Total_products as(
	        SELECT  (SELECT COUNT(category_name) FROM inventory.category) as categories,
			        COUNT(p.product_name) as products, 
			        SUM(p.price * p.stock) as total,
			        (SELECT COUNT(product_id)
			         FROM inventory.products
			         WHERE stock <= 20) as lowStock_products
	        FROM inventory.products p
        )
        SELECT  products,
		        SUM(Total),
		        lowStock_products,
		        categories
        FROM Total_products
        GROUP BY lowStock_products, categories, products  
    """)
    row = cursor.fetchone()

    return jsonify({
            'totalItems': row[0],
            'totalValue': row[1],
            'lowStockItems': row[2],
            'totalCategories': row[3]
        })


@app.post('/addItem')
def addItem():
    conn = connection()
    cursor = conn.cursor()
    
    data = request.json

    productName = data['product_name']
    category = data['category']
    stock = data['stock']
    price = data['price']

    cursor.execute(""" 
                SELECT category_id
                FROM inventory.category
                WHERE category_name = ?
        """, (category,))
    categoryIdRow = cursor.fetchone()
    categoryId = categoryIdRow[0]

    cursor.execute(""" 
            SELECT  product_name,
                    category_id
            FROM inventory.products
            WHERE product_name = ? AND
                  category_id = ?
    """, (productName, categoryId,))
    row = cursor.fetchone()

    if not row:

        cursor.execute(""" 
                INSERT INTO inventory.products (product_name, category_id, stock, price)
                VALUES (?,?,?,?)
        """, (productName, categoryId, stock, price))

        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({'ok': True})

    else:
        cursor.close()
        conn.close()
        return jsonify({'ok': False})

@app.delete('/deleteItem/<int:product_id>')
def deleteItem(product_id):
    conn = connection()
    cursor = conn.cursor()

    cursor.execute(""" 
        DELETE 
        FROM inventory.products
        WHERE product_id = ?
    """,(product_id))

    conn.commit()

    cursor.close()
    conn.close()

    return jsonify({'ok': True})


@app.post('/editItem')
def editItem():
    conn = connection()
    cursor = conn.cursor()
    data = request.json

    productId = data['productId']
    productName = data['productName']
    category = data['category']
    stock = data['stock']
    price = data['price']

    try:
        cursor.execute("""
            SELECT category_id
            FROM inventory.category
            WHERE category_name = ?
        """,(category,))
        categoryId = cursor.fetchone()

        categoryId = categoryId[0]

        cursor.execute(""" 
            UPDATE inventory.products
            SET product_name = ?,
                category_id = ?,
                stock = ?,
                price = ?
            WHERE product_id = ?
        """,(productName,categoryId,stock,price,productId,))
        conn.commit()

        cursor.close()
        conn.close()
        return jsonify({'ok': True})
    except:
        return jsonify({'ok':False})

@app.post('/searchItem')
def searchItem():
    conn = connection()
    cursor = conn.cursor()

    data = request.json

    cursor.execute(""" 
        SELECT p.product_id,
                   p.product_name,
                   c.category_name,
                   p.stock,
                   p.price
            FROM inventory.products p
            JOIN inventory.category c
            ON c.category_id = p.category_id
            WHERE product_name LIKE ?
    """,(f"%{data['Product_name']}%",))
    rows = cursor.fetchall()

    if not rows:
        cursor.execute(""" 
        SELECT p.product_id,
                   p.product_name,
                   c.category_name,
                   p.stock,
                   p.price
            FROM inventory.products p
            JOIN inventory.category c
            ON c.category_id = p.category_id
            WHERE c.category_name LIKE ?
    """,(f"%{data['Product_name']}%",))
        rows = cursor.fetchall()


    products = []

    for row in rows:
        products.append({
            'product_id': row[0],
            'product_name': row[1],
            'category_name': row[2],
            'stock': row[3],
            'price': row[4]
        })

    cursor.close()
    conn.close()
    return jsonify(products)


if __name__ == '__main__':
    app.run(debug=True)