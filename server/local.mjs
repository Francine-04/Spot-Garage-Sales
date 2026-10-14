import app from './index.mjs';
const host=process.env.HOST||'127.0.0.1',port=Number(process.env.PORT||8090);
app.listen(port,host,()=>console.log(`Spot Garage: http://${host}:${port}`));
