# 🔐 CONFIGURACIÓN DE SEGURIDAD - Dashboard SENPA

## ⚠️ IMPORTANTE: API Keys y Variables de Entorno

### 🚨 **¿Has expuesto tu API Key accidentally?**

Si Google te envió un email sobre una API Key expuesta, sigue estos pasos **INMEDIATAMENTE**:

1. **Regenerar API Key en Google Cloud Console**
2. **Agregar restricciones a la nueva key**  
3. **Actualizar las variables de entorno**
4. **NO subir keys directamente al código**

---

## 🛠️ **Configuración Segura**

### **1. Crea tu archivo de entorno local:**
```bash
cp .env.example .env.local
```

### **2. Llena las variables con tus valores reales:**
```env
# .env.local
VITE_SUPABASE_URL=http://tu-servidor-supabase:8003
VITE_SUPABASE_ANON_KEY=tu_supabase_anon_key
VITE_GOOGLE_MAPS_API_KEY=tu_nueva_api_key_segura
```

### **3. Para Vercel (Producción):**
- Ve a tu proyecto en Vercel
- **Settings** → **Environment Variables** 
- Agrega cada variable una por una

---

## 🔒 **Mejores Prácticas de Seguridad**

### **✅ Hacer:**
- ✅ Usar variables de entorno (`VITE_*`)
- ✅ Agregar restricciones a las API Keys
- ✅ Regenerar keys comprometidas
- ✅ Mantener `.env` en `.gitignore`

### **❌ NO Hacer:**
- ❌ Nunca subir API Keys directamente al código
- ❌ No subir archivos `.env` a Git
- ❌ No usar keys sin restricciones
- ❌ No ignorar emails de seguridad de Google

---

## 🚀 **Para Producción (Vercel)**

### **Variables Requeridas:**
```env
VITE_SUPABASE_URL=tu_supabase_url
VITE_SUPABASE_ANON_KEY=tu_supabase_key  
VITE_GOOGLE_MAPS_API_KEY=tu_nueva_google_key
```

### **Restricciones recomendadas para Google Maps API:**
```
Application restrictions:
- HTTP referrers: 
  * https://tu-dominio.vercel.app/*
  * https://localhost:*

API restrictions:
- Maps JavaScript API
- Places API (opcional)
```

---

## 📞 **¿Problemas?**

Si tienes dudas sobre seguridad:
1. Revisa este archivo
2. Consulta la documentación de Google Cloud
3. Verifica que no hay keys expuestas en el código

**¡La seguridad es responsabilidad de todos!** 🛡️