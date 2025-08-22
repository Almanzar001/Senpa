import { supabase } from './config.js';

async function checkTables() {
  try {
    console.log('🔍 Verificando estructura de tablas en Supabase...');
    
    // Verificar tabla notas_informativas
    const { data: notasData, error: notasError } = await supabase
      .from('notas_informativas')
      .select('*')
      .limit(1);
      
    if (notasError) {
      console.error('❌ Error en notas_informativas:', notasError);
    } else if (notasData && notasData.length > 0) {
      console.log('✅ notas_informativas - Campos disponibles:');
      console.log(Object.keys(notasData[0]));
      console.log('📋 Ejemplo de registro:');
      console.log(notasData[0]);
      
      // Verificar específicamente el campo procuraduria
      console.log('\n🔍 Campo procuraduria - tipo y valores:');
      console.log('Tipo:', typeof notasData[0].procuraduria);
      console.log('Valor:', notasData[0].procuraduria);
    }
    
    // Verificar múltiples registros para entender mejor los tipos de datos
    const { data: moreNotas } = await supabase
      .from('notas_informativas')
      .select('procuraduria, notificados')
      .limit(5);
      
    if (moreNotas && moreNotas.length > 0) {
      console.log('\n🔍 Primeros 5 registros - procuraduria y notificados:');
      moreNotas.forEach((nota, index) => {
        console.log(`${index + 1}. procuraduria:`, nota.procuraduria, `(${typeof nota.procuraduria})`);
        console.log(`   notificados:`, nota.notificados, `(${typeof nota.notificados})`);
      });
    }
    
    // Verificar tabla detenidos
    const { data: detenidosData, error: detenidosError } = await supabase
      .from('detenidos')
      .select('*')
      .limit(1);
      
    if (detenidosError) {
      console.error('❌ Error en detenidos:', detenidosError);
    } else if (detenidosData && detenidosData.length > 0) {
      console.log('\n✅ detenidos - Campos disponibles:');
      console.log(Object.keys(detenidosData[0]));
    }
    
    // Verificar tabla vehiculos
    const { data: vehiculosData, error: vehiculosError } = await supabase
      .from('vehiculos')
      .select('*')
      .limit(1);
      
    if (vehiculosError) {
      console.error('❌ Error en vehiculos:', vehiculosError);
    } else if (vehiculosData && vehiculosData.length > 0) {
      console.log('\n✅ vehiculos - Campos disponibles:');
      console.log(Object.keys(vehiculosData[0]));
    }
    
    // Verificar tabla incautaciones
    const { data: incautacionesData, error: incautacionesError } = await supabase
      .from('incautaciones')
      .select('*')
      .limit(1);
      
    if (incautacionesError) {
      console.error('❌ Error en incautaciones:', incautacionesError);
    } else if (incautacionesData && incautacionesData.length > 0) {
      console.log('\n✅ incautaciones - Campos disponibles:');
      console.log(Object.keys(incautacionesData[0]));
    }
    
  } catch (error) {
    console.error('❌ Error general:', error);
  } finally {
    process.exit(0);
  }
}

checkTables();
