export default ctx =>{
  console.log(ctx.accessToken)

  return ctx.accessToken || false;
}