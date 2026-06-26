# Smart Supply - Manual Testing Guide

Welcome! This guide is written for anyone to test the Smart Supply application from scratch. You don't need any technical knowledge to follow these steps. Think of this as a "Walkthrough" of everything the app can do.

Let's test both sides of the system: The **Shop Owner** and the **Vendor (Wholesaler)**.

---

## 🏗️ Step 1: Register as a Shop Owner
Let's pretend you are opening a new retail store and need a software system.

1. **Go to the Registration Page:** Open your browser and go to `http://localhost:3000/register`.
2. **Fill out your details:** 
   - Enter your first and last name.
   - Enter your **Shop Name** (e.g., "SuperMart Retail").
   - Enter your email and a password.
3. **Choose your Role:** Click on the **"I am a Shop / Retailer"** button.
4. **Register:** Click the "Create Account" button.
5. **Subscription:** You will be taken to a page to choose a plan. Click **"Start Free Trial"** on the basic plan.
6. **Simulate Payment:** The system will ask for card details. Since this is testing mode, just click **"Simulate Payment"** without worrying about real card details.
7. **Welcome!** You will be redirected to your new Shop Dashboard!

---

## 📦 Step 2: Add Your First Product
Your shop is empty. Let's put something on the shelf.

1. Look at the menu on the left and click on **"Products"**.
2. Click the **"Add Product"** button in the top right corner.
3. Fill in the product details:
   - **Name:** e.g., "Premium Coffee Beans"
   - **SKU / Barcode:** e.g., "COF-001"
   - **Cost Price:** e.g., 200 (What it costs you to buy)
   - **Selling Price:** e.g., 350 (What you sell it for to customers)
4. Click **"Save Product"**.
5. *Wait! The product has 0 stock.* Click the **"Add Stock"** button next to your new product to bring in a new batch. Type "50" in the quantity and save.

---

## 🧑‍🤝‍🧑 Step 3: Hire an Employee (Staff Management)
You can't run the shop alone. Let's create an account for your cashier.

1. On the left menu, click on **"Staff"**.
2. Click **"Add Staff"**.
3. Fill in their details:
   - Name: e.g., "John Cashier"
   - Email: e.g., "john@supermart.com" (Make sure to remember this and the password you set!)
   - Password: Give them a simple password to log in.
4. Check the boxes for what they are allowed to do (like "Allow Refunds").
5. Click **"Create Account"**.
6. **(New Feature!)** If John forgets his password tomorrow, you can click the yellow "Key" icon next to his name on this page to instantly reset it!

---

## 🛒 Step 4: Sell to a Customer (Point of Sale)
Let's make a sale!

1. On the left menu, click **"POS"** (Point of Sale).
2. You will see the "Premium Coffee Beans" you added earlier. 
3. **Click on the product** to add it to the cart on the right. 
4. You can use the `+` and `-` buttons in the cart to change how many the customer is buying.
5. Click **"Checkout"**.
6. (Optional) Enter the customer's phone number so they can receive an SMS invoice.
7. Choose a payment method (Cash, Card, or UPI) and click **"Confirm Order"**.
8. **Success!** You just made a sale. If you go back to the "Products" page, you'll see the stock has automatically decreased!

---

## 🏭 Step 5: Test the Vendor (Wholesaler) Side
Vendors sell products in huge bulk quantities to shops. Let's see how their side looks.

1. Look for the **"Logout"** button in the bottom left corner and click it.
2. Go back to `http://localhost:3000/register`.
3. Fill in your details again, but this time for a wholesale business (e.g., "Global Distributors Inc").
4. **CRITICAL:** Make sure you click **"I am a Vendor / Supplier"** before clicking Create Account.
5. Pick a plan and click "Simulate Payment" just like before.
6. Notice how the dashboard looks different? It's tailored for B2B (Business-to-Business) operations!

---

## 🏢 Step 6: Test Vendor Bulk Billing
Vendors don't usually sell 1 item at a time; they sell 500 at a time.

1. Add a product just like you did in Step 2 (e.g., "Rice 50kg Sacks") and add stock.
2. Click on **"Bulk Billing (POS)"** in the left menu.
3. Add the product to your cart.
4. Notice the input box in the cart? Because vendors sell in bulk, you don't have to click `+` 500 times. Just **click inside the box and type "500"** directly! (You can also use the `+10` and `-10` buttons for quick adjustments).
5. Click **"Create Bulk Invoice"**.
6. You'll be asked to enter the buying Shop's details (Company Name, GSTIN). This is important for B2B tax invoices.
7. Choose a B2B payment method like **"Bank Txn"** or **"Credit (Net 30)"**.
8. Click **"Confirm Order"**. The bulk order is complete!

---

### Congratulations! 🎉
You have successfully tested the entire core lifecycle of the Smart Supply system, from both the Shop and Vendor perspectives! If you ever get stuck or see an error, make sure your database migrations were applied successfully. Happy Testing!
