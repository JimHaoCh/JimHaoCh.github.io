const menu=document.querySelector('.menu');
const nav=document.querySelector('#nav');
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')==='true';menu.setAttribute('aria-expanded',String(!open));menu.setAttribute('aria-label',open?'開啟導覽選單':'關閉導覽選單');nav.classList.toggle('open',!open)});
nav.querySelectorAll('a').forEach(link=>link.addEventListener('click',()=>{menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','開啟導覽選單');nav.classList.remove('open')}));
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-label','開啟導覽選單');nav.classList.remove('open');menu.focus()}});
const papers=[...document.querySelectorAll('.paper')];
document.querySelectorAll('[data-filter]').forEach(button=>button.addEventListener('click',()=>{document.querySelectorAll('[data-filter]').forEach(other=>other.setAttribute('aria-pressed',String(other===button)));let count=0;papers.forEach(paper=>{paper.hidden=button.dataset.filter!=='all'&&paper.dataset.type!==button.dataset.filter;if(!paper.hidden)count++});document.querySelector('#paper-count').textContent=`顯示 ${count} 篇論文`}));
