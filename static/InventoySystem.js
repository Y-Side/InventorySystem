let addItemForm = document.getElementById("itemForm");
let addInputs = document.querySelectorAll(".add__input")
let clearItemForm = document.getElementById('clearBtn');

let tableProducts = document.getElementById('inventoryTable')

let totalItems = document.getElementById('totalItems')
let totalValue = document.getElementById('totalValue')
let lowStockItems = document.getElementById('lowStockItems')
let totalCategories = document.getElementById('totalCategories')

let addItemMsg = document.getElementById('msg')
let productName = document.getElementById('productName')
let category = document.getElementById('category')
let stock = document.getElementById('quantity')
let price = document.getElementById('price')

let searchBox = document.getElementById('searchBox')



//Connection to backend

let data = []

async function loadProducts() {
    const res = await fetch('https://candra-interepidemic-uncriticizably.ngrok-free.dev/listProducts');
    data = await res.json()
} 

function renderTable(items) {
    for (let i = tableProducts.rows.length - 1; i >= 0; i--) {
        let row = tableProducts.rows[i];
        if (!row.querySelector('#td__no-items') && row.id !== "noResults") {
            tableProducts.deleteRow(i);
        }
    }

    for (let i = 0; i < items.length; i++) {
        let tr = document.createElement('TR')

        tr.innerHTML = `
                <td>${items[i]['product_id']}</td>
                <td>${items[i]['product_name']}</td>
                <td>${items[i]['category_name']}</td>
                <td>${items[i]['stock']}</td>
                <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(items[i]['price'])}</td>
                <td>${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(items[i]['price'] * items[i]['stock'])}</td>
                <td>
                    <span class='status ${getStatus(items[i]['stock']).replace(/ /g, '-').toLowerCase()}'>${getStatus(items[i]['stock'])}</span>
                </td>
                <td>
                    <button class = 'action-btn edit-btn' title='Editar Producto' data-product-id='${items[i]['product_id']}' data-product-name='${items[i]['product_name']}' data-category='${items[i]['category_name']}' data-stock='${items[i]['stock']}' data-price='${items[i]['price']}'>⚙️</button>
                    <button class = 'action-btn delete-btn' data-product-id='${items[i]['product_id']}' title='Eliminar Producto'>🗑</button>
                </td>
        `

        tableProducts.appendChild(tr)
    }
}
    function getStatus(stock) {
        if (stock == 0) {
            return 'out of Stock'
        }
        else if (stock >= .1 && stock <= 10) {
            return 'low stock'
        }
        else {
            return 'in stock'
        }
    }
    //loading Total inventory
    async function totalLoad() {

        const res = await fetch('https://candra-interepidemic-uncriticizably.ngrok-free.dev/totalProducts')
        const data = await res.json()

        totalItems.innerHTML = data['totalItems']
        totalValue.innerHTML = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(data['totalValue'])
        lowStockItems.innerHTML = data['lowStockItems']
        totalCategories.innerHTML = data['totalCategories']

    }


    //adding items to inventory
    async function addItem() {
        let payload = {
            "product_name": productName.value,
            "category": category.value,
            "stock": quantity.value,
            "price": price.value
        }

        let result = await fetch('https://candra-interepidemic-uncriticizably.ngrok-free.dev/addItem', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).then(res => res.json())
            .then(res => {
                return res.ok
            })
        return result

    }



    let modal = null
    let productId = null
    //Event Listeners
    addItemForm.addEventListener("submit", async (e) => {
        e.preventDefault()
        if (await addItem()) {
            addItemMsg.classList.remove('msg_error')
            addItemMsg.classList.add('msg_success')
            addItemMsg.innerHTML = 'El producto se añadio satisfactoriamente'
            await init()
            await totalLoad()

        }
        else {
            addItemMsg.classList.remove('msg_success')
            addItemMsg.classList.add('msg_error')
            addItemMsg.innerHTML = 'No se pudo añadir el producto. Es posible que ya exista o que haya ocurrido un error al procesar la solicitud.'
            await init()
            await totalLoad()

        }
    })

    clearItemForm.addEventListener("click", function () {
        for (let i = 0; i < addInputs.length; i++) {
            addInputs[i].value = "";
        }
    })

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.delete-btn')
        if (!btn) return

        const tr = btn.closest('tr')
        if (!tr) return

        productId = btn.dataset.productId || tr.querySelector('td')?.textContent

        const ok = confirm('¿Estás seguro que quieres eliminar este producto?')
        if (!ok) return

        try {
            const res = await fetch(`https://candra-interepidemic-uncriticizably.ngrok-free.dev/deleteItem/${productId}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                alert('No se pudo eliminar el producto. Intenta de nuevo.')
                return
            }
            alert('Se ha eliminado el producto')
            await init()
            await totalLoad()


        } catch (err) {
            console.error(err)
            alert('Ocurrió un error de conexión. Intenta de nuevo.')
        }
    })

    document.addEventListener('click', async (e) => {
        const btn = e.target.closest('.edit-btn')
        if (!btn) return

        const tr = btn.closest('tr')
        if (!tr) return

        productId = btn.dataset.productId
        modal = document.getElementById('editModal')

        modal.style.display = 'flex'
        modal.classList.remove('hide')
        modal.classList.add('show')

        document.getElementById('editName').value = btn.dataset.productName || tr.querySelector('td')?.textContent
        document.getElementById('editCategory').value = btn.dataset.category || tr.querySelector('td')?.textContent
        document.getElementById('editQuantity').value = btn.dataset.stock || tr.querySelector('td')?.textContent
        document.getElementById('editPrice').value = btn.dataset.price || tr.querySelector('td')?.textContent
    })

    document.getElementById('closeEdit').addEventListener('click', () => {

        modal.classList.remove('show')
        modal.classList.add('hide')

        setTimeout(() => {
            modal.style.display = 'none';
        }, 180);
    })

    document.getElementById('saveEdit').addEventListener('click', async () => {
        let payload = {
            'productId': productId,
            'productName': document.getElementById('editName').value,
            'category': document.getElementById('editCategory').value,
            'stock': document.getElementById('editQuantity').value,
            'price': document.getElementById('editPrice').value,
        }

        try {
            const res = await fetch(`https://candra-interepidemic-uncriticizably.ngrok-free.dev/editItem`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                alert('Se edito el item exitosamente')
                await init()
                await totalLoad()


                modal.classList.remove('show')
                modal.classList.add('hide')

                setTimeout(() => {
                    modal.style.display = 'none';
                }, 180);
            }


        } catch (err) {
            console.error(err)
            alert('Ocurrió un error de conexión. Intenta de nuevo.')
        }
    })


    searchBox.addEventListener('input', () => {

        let text = searchBox.value.trim().toLowerCase()

        if (text === '') {
            document.getElementById('noResults').style.display = 'none'
            if (data.length === 0) {
                document.getElementById("td__no-items").style.display = 'table-cell'
            } else {
                document.getElementById("td__no-items").style.display = 'none'
            }
            renderTable(data)
            return;

        }


        const searchItems = data.filter(p =>
            p.product_name.toLowerCase().includes(text) ||
            p.category_name.toLowerCase().includes(text)

        )

        document.getElementById("td__no-items").style.display = 'none'

        if (searchItems.length === 0) {
            document.getElementById("noResults").style.display = "table-cell";
            renderTable(searchItems)
            return;
        }
        document.getElementById("noResults").style.display = "none";

        renderTable(searchItems)
    })

async function init() {
    await loadProducts()

    if (data.length > 0) {
        document.getElementById("td__no-items").style.display = 'none'
        await totalLoad()
        renderTable(data)
    }
    else {
        document.getElementById("td__no-items").style.display = 'table-cell'
        renderTable(data)
    }
}

init()


console.log(data)

