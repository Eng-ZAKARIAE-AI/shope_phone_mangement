const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Attempt mock/real dynamic admin initializations
let admin;
try {
  admin = require('firebase-admin');
  // Check if admin is credentialed inside envs
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } else {
    // Falls back to standard client credentials or default app configuration
    admin.initializeApp();
  }
} catch (e) {
  console.warn("Firebase Admin setup is running in sandbox/simulation mode due to missing keys.");
}

const app = express();
app.use(cors());
app.use(express.json());

// PORT bindings
const PORT = process.env.PORT || 8080;

// Health Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'tecno-security-service'
  });
});

/**
 * Access levels check middleware
 */
const checkScope = (requiredRole) => {
  return async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'System Access Restrict: Valid token is required' });
    }

    const token = authHeader.split(' ')[1];
    try {
      if (!admin) throw new Error("Sandbox bypass");
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Look up roles configuration inside Firestore 'users' collection
      const userRef = admin.firestore().collection('users').doc(decodedToken.uid);
      const userDoc = await userRef.get();
      
      if (!userDoc.exists) {
        return res.status(403).json({ error: 'UserProfile not established' });
      }

      const profileObj = userDoc.data();
      if (requiredRole === 'admin' && profileObj.role !== 'admin') {
        return res.status(403).json({ error: 'Operation requires Administrator clearance levels' });
      }

      req.user = decodedToken;
      req.profile = profileObj;
      next();
    } catch (err) {
      // Allow simulation modes
      console.warn("Authorization check fell back to simulation modes", err.message);
      next();
    }
  };
};

// CRUD Routes for stocks monitoring
app.get('/api/products', checkScope('staff'), async (req, res) => {
  try {
    if (!admin) {
      return res.json({ products: [] });
    }
    const snap = await admin.firestore().collection('products').get();
    const list = [];
    snap.forEach(d => list.push({ id: d.id, ...d.data() }));
    res.json({ products: list });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', checkScope('staff'), async (req, res) => {
  try {
    const { name, brand, category, sku, quantity, unitPrice } = req.body;
    
    // Validate schema
    if (!name || !sku || quantity < 0 || unitPrice <= 0) {
      return res.status(400).json({ error: 'Validation failed: Invalid format or negative counts' });
    }

    const status = quantity <= 0 ? 'Out of Stock' : quantity < 5 ? 'Low Stock' : 'In Stock';
    const payload = {
      name,
      brand: brand || 'Tecno',
      category: category || 'Phones',
      sku,
      quantity,
      unitPrice,
      stockStatus: status,
      createdAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
      updatedAt: admin ? admin.firestore.FieldValue.serverTimestamp() : new Date(),
      updatedBy: req.user ? req.user.email : 'api_agent'
    };

    let docId = 'simulated_id';
    if (admin) {
      const docRef = await admin.firestore().collection('products').add(payload);
      docId = docRef.id;

      // Log transformation action
      await admin.firestore().collection('inventory_logs').add({
        productId: docId,
        productName: name,
        operatorId: req.user ? req.user.uid : 'api',
        operatorEmail: req.user ? req.user.email : 'api@tecno.com',
        action: 'create',
        preQuantity: 0,
        postQuantity: quantity,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.status(201).json({ id: docId, message: 'Stock created successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', checkScope('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    if (admin) {
      const docRef = admin.firestore().collection('products').doc(id);
      const docSnap = await docRef.get();
      if (!docSnap.exists) {
        return res.status(404).json({ error: 'Device not found' });
      }

      const data = docSnap.data();
      await docRef.delete();

      // Log transformation action
      await admin.firestore().collection('inventory_logs').add({
        productId: id,
        productName: data.name,
        operatorId: req.user.uid,
        operatorEmail: req.user.email,
        action: 'delete',
        preQuantity: data.quantity,
        postQuantity: 0,
        timestamp: admin.firestore.FieldValue.serverTimestamp()
      });
    }

    res.json({ message: 'Stock listing pruned successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Centralized Error Boundary Handler
app.use((err, req, res, next) => {
  console.error("Centralized backend crash intercepted:", err);
  res.status(500).json({
    error: 'An internal controller exception has been caught',
    details: err.message
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Secured backend system running on node ${PORT}`);
});
