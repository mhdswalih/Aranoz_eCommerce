
const PDFDocument = require('pdfkit'); 
const ExcelJS = require('exceljs'); 
const Wallet = require('../model/walletModel');
const order = require('../model/orderModel')

const loadSalesReport = async (req, res) => {
    try {
      const { year, month, day } = req.query;
  
      let query = { 'products.orderStatus': 'Delivered' };
  

      if (year && month && day) {
        const startDate = new Date(year, month - 1, day);  
        const endDate = new Date(year, month - 1, day, 23, 59, 59);  
        query.orderDate = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (year && month) {
        const startDate = new Date(year, month - 1, 1); 
        const endDate = new Date(year, month, 0, 23, 59, 59);  
        query.orderDate = {
          $gte: startDate,
          $lte: endDate
        };
      } else if (year) {
        const startDate = new Date(year, 0, 1);  
        const endDate = new Date(year, 11, 31, 23, 59, 59);  
        query.orderDate = {
          $gte: startDate,
          $lte: endDate
        };
      }
  
      let SalesReport = await order.aggregate([
        {
          $lookup: {
            from: "users",
            localField: 'userId',
            foreignField: '_id',
            as: 'user'
          }
        },
        { $unwind: '$user' },
        { $unwind: '$products' },
        {
          $lookup: {
            from: "products",
            localField: 'products.productId',
            foreignField: '_id',
            as: 'product'
          }
        },
        { $unwind: '$product' },
        { $match: query },
        { $sort: { 'orderDate': -1 } },
        {
          $project: {
            _id: 1,
            orderDate: 1,
            'product.productname': 1,
            'products.productquantity': 1,
            'user.name': 1,
            totalAmount: 1,
            discountAmount: 1,
            selectedPaymentMethod: 1  
          }
        }
      ]);
  
      let totalSale = SalesReport.length;
      res.render('admin/SalesReport', { SalesReport, totalSale });
    } catch (error) {
      console.error("Error loading sales report:", error);
      res.status(500).send('Server error');
    }
  };
  
  

// downloadPdf

const downloadPdf = async (req, res) => {
    try {
        let SalesReport = await order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $unwind: '$products'
            },
            {
                $lookup: {
                    from: "products",
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: '$product'
            },
            {
                $match: { 'products.orderStatus': 'Delivered' }
                
            },
            {
                $sort: { 'orderDate': -1 }
            },
            {
                $project: {
                    _id: 0,
                    orderDate: 1,
                    'product.productname': 1,
                    'products.productquantity': 1,
                    'user.name': 1,
                    totalAmount: 1,
                    discountPrice: 1,
                    selectedPaymentMethod: 1
                }
            }
        ]);

        const doc = new PDFDocument({ margin: 30, size: 'A3' });
        let filename = 'Sales_Report.pdf';

        res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
        res.setHeader('Content-Type', 'application/pdf');

        // Header
        doc.fontSize(26).fillColor('black').text('Company Sales Report', { align: 'center' });
        doc.moveDown(0.5);
        
        // Subtitle
        doc.fontSize(14).fillColor('gray').text('Generated by Aranoz on: ' + new Date().toLocaleDateString(), { align: 'center' });
        doc.moveDown(2);

        // Table header
        const tableTop = 150;
        const columnWidths = {
            date: 70,
            productName: 150,
            quantity: 80,
            billingName: 150,
            totalPrice: 100,
            discountPrice: 100,
            paymentMethod: 120
        };

        const xOffsets = {
            date: 30,
            productName: 30 + columnWidths.date,
            quantity: 30 + columnWidths.date + columnWidths.productName,
            billingName: 30 + columnWidths.date + columnWidths.productName + columnWidths.quantity,
            totalPrice: 30 + columnWidths.date + columnWidths.productName + columnWidths.quantity + columnWidths.billingName,
            discountPrice: 30 + columnWidths.date + columnWidths.productName + columnWidths.quantity + columnWidths.billingName + columnWidths.totalPrice,
            paymentMethod: 30 + columnWidths.date + columnWidths.productName + columnWidths.quantity + columnWidths.billingName + columnWidths.totalPrice + columnWidths.discountPrice
        };

        // Table Header
        doc.fontSize(10).fillColor('white').rect(30, tableTop, xOffsets.paymentMethod + columnWidths.paymentMethod - 30, 20).fill('#2c3e50').stroke();
        
        // Header Text
        doc.fillColor('white')
            .text('Date', xOffsets.date, tableTop + 5)
            .text('Product Name', xOffsets.productName, tableTop + 5)
            .text('Quantity', xOffsets.quantity, tableTop + 5)
            .text('Billing Name', xOffsets.billingName, tableTop + 5)
            .text('Total Price', xOffsets.totalPrice, tableTop + 5)
            .text('Discount Price', xOffsets.discountPrice, tableTop + 5)
            .text('Payment Method', xOffsets.paymentMethod, tableTop + 5);

        let currentTop = tableTop + 20; // Start below the header
        const itemsPerPage = 20;

        SalesReport.forEach((sale, i) => {
            // Log sale data for debugging
            console.log('Sale Data:', sale);
        
            if (i > 0 && i % itemsPerPage === 0) {
                doc.addPage();
                currentTop = tableTop + 20; // Reset for new page
                
                // Repeat table header on each page
                doc.fontSize(10).fillColor('white').rect(30, tableTop, xOffsets.paymentMethod + columnWidths.paymentMethod - 30, 20).fill('#2c3e50').stroke();
                doc.fillColor('white')
                    .text('Date', xOffsets.date, tableTop + 5)
                    .text('Product Name', xOffsets.productName, tableTop + 5)
                    .text('Quantity', xOffsets.quantity, tableTop + 5)
                    .text('Billing Name', xOffsets.billingName, tableTop + 5)
                    .text('Total Price', xOffsets.totalPrice, tableTop + 5)
                    .text('Discount Price', xOffsets.discountPrice, tableTop + 5)
                    .text('Payment Method', xOffsets.paymentMethod, tableTop + 5);
            }
        
            // Alternate row colors
            if (i % 2 === 0) {
                doc.fillColor('#f8f9fa').rect(30, currentTop, xOffsets.paymentMethod + columnWidths.paymentMethod - 30, 20).fill().stroke();
            }
        
            // Data rows
            doc.fillColor('black').text(new Date(sale.orderDate).toLocaleDateString(), xOffsets.date, currentTop + 5);
            doc.text(sale.product.productname || 'N/A', xOffsets.productName, currentTop + 5);
            doc.text(sale.products.productquantity || 0, xOffsets.quantity, currentTop + 5);
            doc.text(sale.user.name || 'Unknown', xOffsets.billingName, currentTop + 5);
            doc.text(`₹${sale.totalAmount ? sale.totalAmount.toFixed(2) : '0.00'}`, xOffsets.totalPrice, currentTop + 5);
            doc.text(`₹${sale.discountPrice ? sale.discountPrice.toFixed(2) : '-'}`, xOffsets.discountPrice, currentTop + 5);            
            doc.text(sale.selectedPaymentMethod || 'N/A', xOffsets.paymentMethod, currentTop + 5);
            
            currentTop += 20; // Move to the next row
        });

        // Final branding statement
        doc.moveDown(2);
        doc.fontSize(12).fillColor('gray').text('', { align: 'center' });

        doc.pipe(res);
        doc.end();
    } catch (error) {
        console.error("Error generating PDF:", error);
        res.status(500).send('Server error');
    }
};

const downloadExcel = async (req, res) => {
    try {
        // Fetch data
        let SalesReport = await order.aggregate([
            {
                $lookup: {
                    from: "users",
                    localField: 'userId',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            {
                $unwind: '$user'
            },
            {
                $unwind: '$products' 
            },
            {
                $lookup: {
                    from: "products",
                    localField: 'products.productId',
                    foreignField: '_id',
                    as: 'product'
                }
            },
            {
                $unwind: '$product'
            },
            {
                $match: { 'products.orderStatus': 'Delivered' }
            },
            {
                $sort: { 'orderDate': -1 }
            },
            {
                $project: {
                    _id: 0,
                    orderDate: 1,
                    'product.productname': 1,
                    'products.productquantity': 1,
                    'user.name': 1,
                    'product.productprice': 1, // Include product price
                    'product.discountedPrice': 1, // Include discounted price
                    totalAmount: 1,
                    selectedPaymentMethod: 1
                }
            }
        ]);

        // Create a new workbook and add a worksheet
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Sales Report');

        // Define columns
        worksheet.columns = [
            { header: 'Date', key: 'date', width: 15 },
            { header: 'Product Name', key: 'productName', width: 30 },
            { header: 'Quantity', key: 'quantity', width: 10 },
            { header: 'Billing Name', key: 'billingName', width: 25 },
            { header: 'Total Price', key: 'totalPrice', width: 15 },
            { header: 'Discount Price', key: 'discountPrice', width: 15 },
            { header: 'Payment Method', key: 'paymentMethod', width: 20 }
        ];

        // Add rows
        let totalDiscountAmount = 0;

        SalesReport.forEach(sale => {
            const product = sale.product; 
            const unitPrice = product.productprice || 0; 
            const quantity = sale.products.productquantity || 0; 
            const totalPrice = unitPrice * quantity;
        
            const discountPrice = product.discountedPrice && product.discountedPrice < unitPrice
                ? product.discountedPrice * quantity
                : 0;
        
            const discountAmount = discountPrice > 0 ? totalPrice - discountPrice : 0;
            totalDiscountAmount += discountAmount;
        
            worksheet.addRow({
                date: new Date(sale.orderDate).toLocaleDateString(),
                productName: product.productname.length > 15 ? product.productname.substring(0, 15) + '...' : product.productname,
                quantity: quantity,
                billingName: sale.user.name,
                totalPrice: `₹${totalPrice.toFixed(2)}`,
                discountPrice: discountPrice > 0 ? `₹${discountPrice.toFixed(2)}` : '-',
                paymentMethod: sale.selectedPaymentMethod
            });
        });
        

        // Set response headers for file download
        res.setHeader('Content-Disposition', 'attachment; filename=Sales_Report.xlsx');
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        
        
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Error generating Excel file:", error);
        res.status(500).send('Server error');
    }
};

const loadWallet = async (req, res) => {
    try {
        const userId = req.session.user;
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        // Pagination variables
        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 
        const startIndex = (page - 1) * limit; 
        const endIndex = page * limit; 

       
        const transactions = wallet.history.slice(startIndex, endIndex);
        
        // Calculate total pages
        const totalPages = Math.ceil(wallet.history.length / limit);
        
        res.render('user/Wallet', {
            wallet: wallet,
            user: req.session.user,
            transactions: transactions, // Pass the sliced transactions
            currentPage: page,
            totalPages: totalPages,
        });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};







//getwalletDetails
const getWalletDetails = async (req, res) => {
    try {
        const userId = req.session.user; 
        const wallet = await Wallet.findOne({ userId });

        if (!wallet) {
            return res.status(404).json({ message: 'Wallet not found' });
        }

        res.json(wallet);
    } catch (error) {
        console.error('Error fetching wallet details:', error);
        res.status(500).json({ message: 'Error fetching wallet details', error });
    }
};

// const getTransactionHistory = async (req, res) => {
//     try {
//         const userId = req.session.user; 
//         const wallet = await Wallet.findOne({ userId });

//         if (!wallet) {
//             return res.status(404).json({ message: 'Wallet not found' });
//         }

//         res.status(200).json(wallet.history);
//     } catch (error) {
//         console.error('Error fetching transaction history:', error);
//         res.status(500).json({ message: 'Error fetching transaction history', error });
//     }
// };

// const addFunds = async (req, res) => {
//     try {
//         const userId = req.session.user; 
//         const { amount } = req.body;

//         if (amount <= 0) {
//             return res.status(400).json({ message: 'Invalid amount' });
//         }

//         let wallet = await Wallet.findOne({ userId });

//         if (!wallet) {
//             wallet = new Wallet({ userId, balance: 0, history: [] });
//         }

//         wallet.balance += amount;
//         wallet.history.push({
//             date: new Date(),
//             amount,
//             transactionType: 'credit',
//             newBalance: wallet.balance,
//             description: 'Funds added',
//         });

//         await wallet.save();

//         res.status(200).json({ message: 'Funds added successfully', wallet });
//     } catch (error) {
//         console.error('Error adding funds:', error);
//         res.status(500).json({ message: 'Error adding funds', error });
//     }
// };

// const withdrawFunds = async (req, res) => {
//     try {
//         const userId = req.session.user; 
//         const { amount } = req.body;

//         if (amount <= 0) {
//             return res.status(400).json({ message: 'Invalid amount' });
//         }

//         let wallet = await Wallet.findOne({ userId });

//         if (!wallet || wallet.balance < amount) {
//             return res.status(400).json({ message: 'Insufficient balance' });
//         }

//         wallet.balance -= amount;
//         wallet.history.push({
//             date: new Date(),
//             amount,
//             transactionType: 'debit',
//             newBalance: wallet.balance,
//             description: 'Funds withdrawn',
//         });

//         await wallet.save();

//         res.status(200).json({ message: 'Funds withdrawn successfully', wallet });
//     } catch (error) {
//         console.error('Error withdrawing funds:', error);
//         res.status(500).json({ message: 'Error withdrawing funds', error });
//     }
// };


//loadOrderDetails page
const loadOrderDetails = async (req, res) => {
    try {
        // Ensure that req.params.id is a valid ObjectId
        const orderId = req.params.id;

        const orders = await order.findById(orderId)
            .populate('userId')
            .populate('addressId')
            .populate('products.productId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        res.render('admin/orderDetails', { orders });
    } catch (error) {
        console.log('Error:', error);
        res.status(500).render('500', { message: 'Internal Server Error' });
    }
};




module.exports = {
    loadSalesReport,
    downloadPdf,
    downloadExcel,
    loadWallet,
    getWalletDetails,
    // getTransactionHistory,
    // addFunds,
    // withdrawFunds,
    loadOrderDetails,
};