import { supabase } from './src/services/supabase.js';

async function debugProcuraduria() {
  try {
    console.log('🔍 Conectando a Supabase para verificar datos de procuraduria...');
    
    // Obtener todos los registros de notas_informativas
    const { data: notasData, error: notasError } = await supabase
      .from('notas_informativas')
      .select('numero_caso, procuraduria')
      .limit(50); // Primeros 50 registros para analizar
    
    if (notasError) {
      console.error('❌ Error obteniendo notas_informativas:', notasError);
      return;
    }
    
    console.log(`📊 Total de registros analizados: ${notasData.length}`);
    console.log('\n🔍 Análisis de valores de procuraduria:');
    
    // Analizar los valores únicos de procuraduria
    const procuraduriaValues = {};
    let nullCount = 0;
    let undefinedCount = 0;
    let siCount = 0;
    let noCount = 0;
    
    notasData.forEach((nota, index) => {
      const value = nota.procuraduria;
      const key = value === null ? 'null' : value === undefined ? 'undefined' : String(value);
      
      if (!procuraduriaValues[key]) {
        procuraduriaValues[key] = 0;
      }
      procuraduriaValues[key]++;
      
      // Conteos específicos
      if (value === null) nullCount++;
      else if (value === undefined) undefinedCount++;
      else if (value === 'SI' || value === 'Si' || value === 'si') siCount++;
      else if (value === 'NO' || value === 'No' || value === 'no') noCount++;
      
      // Mostrar primeros 10 registros como muestra
      if (index < 10) {
        console.log(`  ${index + 1}. Caso: ${nota.numero_caso}, Procuraduria: "${value}" (tipo: ${typeof value})`);
      }
    });
    
    console.log('\n📈 Resumen de valores únicos:');
    Object.entries(procuraduriaValues).forEach(([key, count]) => {
      console.log(`  "${key}": ${count} casos`);
    });
    
    console.log('\n🎯 Conteos específicos:');
    console.log(`  - Casos con procuraduria = SI/Si/si: ${siCount}`);
    console.log(`  - Casos con procuraduria = NO/No/no: ${noCount}`);
    console.log(`  - Casos null: ${nullCount}`);
    console.log(`  - Casos undefined: ${undefinedCount}`);
    
    // Verificar también la tabla vehiculos
    console.log('\n🚗 Verificando tabla vehiculos...');
    const { data: vehiculosData, error: vehiculosError } = await supabase
      .from('vehiculos')
      .select('procuraduria')
      .limit(20);
    
    if (vehiculosError) {
      console.error('❌ Error obteniendo vehiculos:', vehiculosError);
    } else {
      console.log(`📊 Registros de vehiculos analizados: ${vehiculosData.length}`);
      const vehiculosProcuraduriaValues = {};
      vehiculosData.forEach(vehiculo => {
        const value = vehiculo.procuraduria;
        const key = value === null ? 'null' : value === undefined ? 'undefined' : String(value);
        if (!vehiculosProcuraduriaValues[key]) {
          vehiculosProcuraduriaValues[key] = 0;
        }
        vehiculosProcuraduriaValues[key]++;
      });
      
      console.log('🚗 Valores de procuraduria en vehiculos:');
      Object.entries(vehiculosProcuraduriaValues).forEach(([key, count]) => {
        console.log(`  "${key}": ${count} casos`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  }
}

debugProcuraduria();
