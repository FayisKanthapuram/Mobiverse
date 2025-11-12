function brandFilter(e){
  const brand=e.getAttribute('name')||'';
  const url=new URL(window.location);
  if(brand){
    url.searchParams.set('brand',brand);
  }else{
    url.searchParams.delete('brand');
  }
  url.searchParams.set('page',1);
  window.location=url.href;
}

function applyFilter(){
  const sortBy=document.getElementById('sort-by').value||'';
  const minPrice=document.getElementById('price-from').value;
  const maxPrice=document.getElementById('price-to').value;
  const url=new URL(window.location);
  if(sortBy){
    url.searchParams.set('sort',sortBy);
  }else{
    url.searchParams.delete('sort');
  }
  if(minPrice){
    url.searchParams.set('min',minPrice);
  }else{
    url.searchParams.delete('min');
  }
  if(maxPrice){
    url.searchParams.set('max',maxPrice);
  }else{
    url.searchParams.delete('max');
  }
  url.searchParams.set('page',1);
  window.location=url.href;
}

function changePage(page) {
  const url = new URL(window.location);
  if(page){
    url.searchParams.set("page", page);
  }else{
    url.searchParams.delete('page');
  }
  window.location.href = url.href;
}