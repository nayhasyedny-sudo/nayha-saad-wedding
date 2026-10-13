'use strict';
(() => {
  /* ─────────────────────────────────────────────────────────────
     EDIT HERE — everything a guest sees that may still change.
     Leave a value '' (empty) and that line simply won't be shown.
     ───────────────────────────────────────────────────────────── */
  const CONFIG = Object.freeze({
    coupleShort: 'Nayha & Saad',
    hosts: '',                       // e.g. 'Mr. & Mrs. Syed and Mr. & Mrs. Naeem request the honour of your presence at the marriage of their children'
    rsvpBy: '2026-11-07',            // ISO date. Shown as "Saturday, November 7"
    oldWestburyAddress: '136 I.U. Willets Road · Old Westbury, NY 11568',
    contact: { name: 'Khadijah', role: 'our wedding planner', phone: '' },   // phone as digits with country code, e.g. '12125551234'
    hotels: [{name:'Baccarat Hotel New York',blurb:'28 West 53rd Street, Manhattan — the hotel beneath the Residences, steps from the Baccarat Party.',url:'https://www.baccarathotels.com/'},{name:'The Garden City Hotel',blurb:'45 Seventh Street, Garden City — about fifteen minutes from Old Westbury for the Nikah, Mehndi and Reception.',url:'https://www.gardencityhotel.com/'}],
    transport: '',                   // e.g. 'A shuttle from Manhattan will run for the Nikah, Mehndi & Reception — details to follow with your confirmation.'
    parking: '',                     // e.g. 'Valet parking is available at the Syed Residence. There is no parking at Baccarat — please arrive by car service or taxi.'
    gifts: 'Your presence is the greatest gift. Should you wish to celebrate with something more, we are registered at Bloomingdale’s.',
    registryUrl: '',                 // Bloomingdale's registry link
    attireNotes: [],
    faq: [                           // extra Q&As; add or remove freely
      // {q:'Will alcohol be served?', a:'…'},
      // {q:'Are children welcome?', a:'…'},
      // {q:'Is there a prayer space?', a:'…'},
    ],
    hashtag: '',
    rsvp: {                          // provider: 'netlify' (works as soon as the site is on Netlify) or 'google' (needs formId + entries)
      provider: 'netlify',
      formId: '',                    // the long id from …/forms/d/e/<formId>/viewform
      entries: { name: '', phone: '', attendance: '', adults: '', children: '', events: '', dietary: '', note: '' }  // 'entry.123456789' each
    }
  });

  const events = Object.freeze([
    {id:'baccarat',code:'C',name:'Baccarat Party',kicker:'Champagne beginnings',date:'2026-11-14',dateLabel:'Saturday, November 14, 2026',city:'New York, NY',venue:'Baccarat Residences',address:'20 West 53rd Street, Apt 18A · New York, NY 10019',mapQuery:'Baccarat Residences, 20 West 53rd Street, New York, NY 10019',time:'4:00 pm',hour:16,minute:0,durationHours:5,intro:'An evening of champagne, crystal and candlelight to begin our wedding celebrations.',attire:'Black Tie Glamour',theme:'',imageAlt:'Red roses and crystal glassware by candlelight.'},
    {id:'mehndi',code:'M',name:'Nikah & Mehndi',kicker:'Love, color & celebration',date:'2026-11-21',dateLabel:'Saturday, November 21, 2026',city:'Old Westbury, NY',venue:'Syed Residence',address:'',mapQuery:'',residence:true,time:'Nikah 3:00 pm · Mehndi 4:00 pm',hour:15,minute:0,durationHours:7,intro:'Join us for our Nikah, followed by a joyful Mehndi filled with color, music and the people we love.',attire:'Pakistani Formal',theme:'',imageAlt:'Brass lanterns, jewel-toned silks and roses.'},
    {id:'reception',code:'R',name:'Reception',kicker:'A beautiful beginning',date:'2026-11-22',dateLabel:'Sunday, November 22, 2026',city:'Old Westbury, NY',venue:'Syed Residence',address:'',mapQuery:'',residence:true,time:'Cocktails & reception 4:00 pm',hour:16,minute:0,durationHours:6,intro:'An evening together to celebrate our marriage and the beginning of a beautiful new chapter.',attire:'Black Tie',theme:'',imageAlt:'Antique gold chandeliers and an ivory reception setting.'},
    {id:'valima',code:'V',name:'Valima',kicker:'With love & gratitude',date:'2026-11-25',dateLabel:'Wednesday, November 25, 2026',city:'Great Neck, NY',venue:'Leonard’s Palazzo',address:'555 Northern Boulevard · Great Neck, NY 11021',mapQuery:'Leonard\'s Palazzo, 555 Northern Blvd, Great Neck, NY 11021',time:'',hour:null,minute:0,durationHours:5,intro:'An evening of love and gratitude to close our celebrations.',attire:'Pakistani Formal',theme:'',imageAlt:'A pale-blue and ivory ballroom with crystal chandeliers.'}
  ]);

  const $ = id => document.getElementById(id);
  const params = new URLSearchParams(location.search);
  const requestedCodes = params.get('ev') || 'CMRV';
  const codes = /^[CMRV]+$/i.test(requestedCodes) ? requestedCodes.toUpperCase() : 'CMRV';
  const invited = events.filter(event => codes.includes(event.code));
  const byId = new Map(invited.map(event => [event.id,event]));
  const pages = [...document.querySelectorAll('.page')];
  const residenceAddress = CONFIG.oldWestburyAddress;
  let activeEvent = invited[0];
  let step = 0;
  let response = {attendance:'yes',name:'',phone:'',adults:1,children:0,events:invited.map(e=>e.id),dietary:'',note:''};
  let opener = null;
  let toastTimer;
  const greeting = (params.get('to') || '').trim().slice(0,100);
  if (greeting) response.name = greeting;
  const rsvpLive = CONFIG.rsvp.provider==='netlify' ? /netlify\.app$|^(?!.*claude\.ai).*\.[a-z]+$/.test(location.hostname)&&location.protocol==='https:'&&!/claude\.ai|localhost/.test(location.hostname) : Boolean(CONFIG.rsvp.formId);

  function text(id,value){$(id).textContent=value;}
  function element(tag,className,value){const el=document.createElement(tag);if(className)el.className=className;if(value!==undefined)el.textContent=value;return el;}
  function button(label,action,className='ornate-button'){const el=element('button',className,label);el.type='button';el.addEventListener('click',action);return el;}
  function longDate(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'});}
  function shortDate(iso){const [y,m,d]=iso.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'long',day:'numeric'});}
  function mapsUrl(query){return 'https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(query);}
  function venueAddress(event){return event.residence ? residenceAddress : event.address;}
  function venueMapQuery(event){return event.residence ? (residenceAddress ? 'Syed Residence, '+residenceAddress.replace(' · ',', ') : '') : event.mapQuery;}

  function currentRoute(){
    const segments=location.hash.replace(/^#\/?/,'').split('/');
    if(segments[0]==='event'&&byId.has(segments[1]))return {page:'event',event:segments[1]};
    return {page:['celebrations','details','respond'].includes(segments[0])?segments[0]:'cover'};
  }
  function go(page,event){const hash=page==='event'?`#event/${event}`:`#${page}`;if(location.hash===hash)renderRoute();else location.hash=hash;}
  function renderRoute(){
    const route=currentRoute();
    if($('detail-dialog').open)$('detail-dialog').close();
    pages.forEach(page=>{page.hidden=page.id!==route.page;page.setAttribute('aria-hidden',String(page.hidden));});
    $('suite-nav').hidden=route.page==='cover';
    $('invitation').dataset.page=route.page;
    const selected=route.page==='event'?'celebrations':route.page;
    $('suite-nav').querySelectorAll('button').forEach(el=>{if(el.dataset.go===selected)el.setAttribute('aria-current','page');else el.removeAttribute('aria-current');});
    if(route.page==='event')renderEvent(byId.get(route.event));
    if(route.page==='respond')renderResponse();
    const titles={cover:`${CONFIG.coupleShort} · November 2026`,celebrations:`Our Celebrations · ${CONFIG.coupleShort}`,details:`A Few Details · ${CONFIG.coupleShort}`,respond:`Kindly Respond · ${CONFIG.coupleShort}`,event:activeEvent.name+` · ${CONFIG.coupleShort}`};
    document.title=titles[route.page];
    const title=$(route.page).querySelector('h1,h2');
    requestAnimationFrame(()=>title?.focus({preventScroll:true}));
  }

  function renderCards(){
    const list=$('event-list');list.replaceChildren();
    invited.forEach(event=>{
      const card=button('',()=>go('event',event.id),'event-card');
      card.setAttribute('aria-label',`${event.name}, ${event.dateLabel}, ${event.city}`);
      const img=element('img','event-thumb');img.src=`assets/${event.id}.webp`;img.alt='';img.loading='lazy';img.width=310;img.height=300;
      const copy=element('span','event-copy');
      copy.append(element('span','event-name',event.name),element('span','event-date',event.dateLabel.replace(', 2026','')));
      const arrow=element('span','chevron','›');arrow.setAttribute('aria-hidden','true');card.append(img,copy,arrow);list.append(card);
    });
    const g=$('greeting');g.hidden=!greeting;if(greeting)g.textContent=`Dear ${greeting}`;
    const h=$('host-line');h.hidden=!CONFIG.hosts;if(CONFIG.hosts)h.textContent=CONFIG.hosts;
    const first=invited[0];const cd=$('countdown');if(first){const [y,m,d]=first.date.split('-').map(Number);const today=new Date();const days=Math.round((Date.UTC(y,m-1,d)-Date.UTC(today.getFullYear(),today.getMonth(),today.getDate()))/864e5);cd.hidden=days<0;cd.textContent=days===0?`Today is the ${first.name}`:days===1?`One day until the ${first.name}`:`${days} days until the ${first.name}`;}else cd.hidden=true;
  }

  function renderEvent(event){
    activeEvent=event;text('event-title',event.name);text('event-date',event.dateLabel);
    $('event-image').src=`assets/${event.id}.webp`;$('event-image').alt=event.imageAlt;
    text('event-intro',event.intro);text('event-venue',event.venue);
    const address=venueAddress(event);
    text('event-address',address||(event.residence?'The full address will be shared with your confirmation.':''));$('event-address').hidden=!(address||event.residence);
    const whenRow=$('event-time').parentElement;whenRow.hidden=!event.time;text('event-time',event.time);
    const attireRow=$('event-attire').parentElement;attireRow.hidden=!event.attire;text('event-attire',event.attire);text('event-theme',event.theme);$('event-theme').hidden=!event.theme;
    const map=$('directions');const q=venueMapQuery(event);map.hidden=!q;if(q)map.href=mapsUrl(q);
    const google=$('calendar-google');google.href=googleCalendarUrl(event);
    const apple=$('calendar-apple');apple.href=`assets/calendar/${event.id}.ics`;apple.setAttribute('download',`Nayha-Saad-${event.id}.ics`);
    $('calendar-apple').setAttribute('aria-label',`Add ${event.name} to Apple or Outlook calendar`);$('calendar-google').setAttribute('aria-label',`Add ${event.name} to Google Calendar`);
  }

  /* ── Calendar ───────────────────────────────────────────────── */
  // All dates fall after New York's November 1, 2026 DST transition → EST, UTC−5.
  function utcStamp(date,hour,minute){return new Date(`${date}T${String(hour).padStart(2,'0')}:${String(minute).padStart(2,'0')}:00-05:00`).toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');}
  function nextDay(date){const [y,m,d]=date.split('-').map(Number);const n=new Date(Date.UTC(y,m-1,d+1));return n.toISOString().slice(0,10).replaceAll('-','');}
  function eventSpan(event){
    if(event.hour===null)return {allDay:true,start:event.date.replaceAll('-',''),end:nextDay(event.date)};
    const endHour=event.hour+event.durationHours;
    return {allDay:false,start:utcStamp(event.date,event.hour,event.minute),end:utcStamp(event.date,endHour,event.minute)};
  }
  function escapeICS(value){return String(value).replace(/\\/g,'\\\\').replace(/\r?\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;');}
  function fold(line){const bytes=new TextEncoder().encode(line);if(bytes.length<=75)return line;let out='',chunk='';for(const ch of line){if(new TextEncoder().encode(chunk+ch).length>(out?74:75)){out+=(out?'\r\n ':'')+chunk;chunk=ch;}else chunk+=ch;}return out+(out?'\r\n ':'')+chunk;}
  function icsDescription(event){const parts=[event.intro,event.time,event.attire?'Attire: '+event.attire+(event.theme?' · '+event.theme:''):'',CONFIG.hashtag];return parts.filter(Boolean).join('\n');}
  function vevent(event){
    const span=eventSpan(event);const address=venueAddress(event);
    return [
      'BEGIN:VEVENT',`UID:${event.id}-2026@nayha-saad-invitation`,'DTSTAMP:'+new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z'),
      span.allDay?'DTSTART;VALUE=DATE:'+span.start:'DTSTART:'+span.start,
      span.allDay?'DTEND;VALUE=DATE:'+span.end:'DTEND:'+span.end,
      'SUMMARY:'+escapeICS(`${event.name} · ${CONFIG.coupleShort}`),
      'LOCATION:'+escapeICS(event.venue+(event.residence?' · Old Westbury':'')+(address?' · '+address:'')),
      'DESCRIPTION:'+escapeICS(icsDescription(event)),
      'END:VEVENT'
    ];
  }
  function calendar(list){
    const lines=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Nayha and Saad//Wedding Invitation//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH',...list.flatMap(vevent),'END:VCALENDAR'];
    return lines.map(fold).join('\r\n')+'\r\n';
  }
  function googleCalendarUrl(event){
    const span=eventSpan(event);const address=venueAddress(event);
    const p=new URLSearchParams({action:'TEMPLATE',text:`${event.name} · ${CONFIG.coupleShort}`,dates:`${span.start}/${span.end}`,details:icsDescription(event),location:event.venue+(event.residence?' · Old Westbury':'')+(address?', '+address:''),ctz:'America/New_York'});
    return 'https://calendar.google.com/calendar/render?'+p.toString();
  }
  function downloadAll(){const url=URL.createObjectURL(new Blob([calendar(invited)],{type:'text/calendar;charset=utf-8'}));const a=element('a');a.href=url;a.download='Nayha-Saad-celebrations.ics';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('All your celebrations are ready to add.');}
  function notify(message){text('toast',message);$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,4200);}

  /* ── Details dialogs ────────────────────────────────────────── */
  function detailsFor(key){
    if(key==='travel'){
      const sections=[];
      invited.forEach(e=>{const address=venueAddress(e);sections.push({heading:e.name,body:`${e.venue}${address?' · '+address:''}`});});
      if(CONFIG.hotels.length){sections.push({heading:'Where to stay',body:'Guests coming from out of town are welcome to stay at the '+CONFIG.hotels.map(h=>h.name).join(' or ')+'.'});CONFIG.hotels.forEach(h=>sections.push({heading:h.name,body:h.blurb,link:h.url,linkLabel:'Visit the hotel'}));}
      if(CONFIG.transport)sections.push({heading:'Getting there',body:CONFIG.transport});
      if(CONFIG.parking)sections.push({heading:'Parking',body:CONFIG.parking});
            return {title:'Travel & Stay',sections};
    }
    if(key==='attire'){
      const sections=invited.filter(e=>e.attire).map(e=>({heading:e.name,body:e.attire+(e.theme?' · '+e.theme:'')}));
      CONFIG.attireNotes.forEach(n=>sections.push({heading:'A note',body:n}));
      return {title:'Attire Guide',sections};
    }
    if(key==='registry')return {title:'Registry',sections:[{heading:'With love',body:CONFIG.gifts,link:CONFIG.registryUrl,linkLabel:'View our registry'}]};
    const faq=[{heading:'When should I respond?',body:`Kindly respond by ${longDate(CONFIG.rsvpBy)}, 2026${rsvpLive?' using the Respond page':''}.`},{heading:'Where can I find the schedule?',body:'Each celebration has its own page with the venue, arrival time and attire, and you can add each date — or all of them — to your calendar.'}];
    CONFIG.faq.forEach(f=>faq.push({heading:f.q,body:f.a}));
    if(CONFIG.contact.phone)faq.push({heading:'Who can I ask?',body:`${CONFIG.contact.name}, ${CONFIG.contact.role}, is happy to help on WhatsApp: +${CONFIG.contact.phone}`});
    return {title:'A Few Questions',sections:faq};
  }
  function openDetails(key,trigger){const detail=detailsFor(key);opener=trigger;text('dialog-title',detail.title);const body=$('dialog-body');body.replaceChildren();detail.sections.forEach(section=>{body.append(element('h3','',section.heading),element('p','',section.body));if(section.link){const a=element('a','dialog-link',section.linkLabel||'Open');a.href=section.link;a.target='_blank';a.rel='noopener';body.append(a);}});$('detail-dialog').showModal();}
  function closeDetails(){$('detail-dialog').close();}
  $('detail-dialog').addEventListener('close',()=>opener?.focus());
  $('detail-dialog').addEventListener('click',event=>{if(event.target===$('detail-dialog')){const r=$('detail-dialog').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)closeDetails();}});

  /* ── RSVP ───────────────────────────────────────────────────── */
  function titleForStep(value){text('respond-title',value);}
  function field(labelText,input){const label=element('label','',labelText);label.append(input);return label;}
  function numberSelect(name,from,to,value,noun){const select=element('select');select.name=name;for(let i=from;i<=to;i++){const o=element('option','',`${i} ${noun(i)}`);o.value=String(i);select.append(o);}select.value=String(value);return select;}
  async function submitResponse(){
    if(!rsvpLive)return false;
    if(CONFIG.rsvp.provider==='netlify'){
      const body=new URLSearchParams({'form-name':'rsvp',name:response.name,phone:response.phone,attendance:response.attendance==='yes'?'Attending':'Unable to attend',adults:response.attendance==='yes'?String(response.adults):'',children:response.attendance==='yes'?String(response.children):'',events:response.attendance==='yes'?response.events.map(id=>byId.get(id).name).join(', '):'',dietary:response.dietary,note:response.note,link:location.search});
      try{const r=await fetch('/',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body});return r.ok;}catch{return false;}
    }
    const e=CONFIG.rsvp.entries;const body=new URLSearchParams();
    const put=(k,v)=>{if(k&&v!==undefined&&v!=='')body.append(k,String(v));};
    put(e.name,response.name);put(e.phone,response.phone);put(e.attendance,response.attendance==='yes'?'Attending':'Unable to attend');
    if(response.attendance==='yes'){put(e.adults,response.adults);put(e.children,response.children);response.events.forEach(id=>put(e.events,byId.get(id).name));put(e.dietary,response.dietary);}
    put(e.note,response.note);
    try{await fetch(`https://docs.google.com/forms/d/e/${CONFIG.rsvp.formId}/formResponse`,{method:'POST',mode:'no-cors',body});return true;}catch{return false;}
  }
  function renderResponse(){
    const body=$('response-body');body.replaceChildren();
    text('respond-deadline',`Kindly respond by ${longDate(CONFIG.rsvpBy)}`);
    $('preview-note').hidden=rsvpLive;
        if(step===0){
      titleForStep('Kindly Respond');body.append(element('p','response-lead','We look forward to celebrating with you.'));
      const yes=button('',()=>{response.attendance='yes';step=1;renderResponse();},'ornate-button response-choice');yes.append(element('strong','','Yes'),element('small','','I’ll be there'));
      const no=button('',()=>{response.attendance='no';step=1;renderResponse();},'ornate-button response-choice');no.append(element('strong','','Regretfully'),element('small','','I can’t make it'));
      const crest=element('img','response-crest');crest.src='assets/monogram-rococo.webp';crest.alt='';body.append(yes,no,crest);return;
    }
    if(step<4)body.append(element('p','step-label',`Step ${step} of 3`));
    if(step===1){
      titleForStep('Your Details');const form=element('form','response-form');
      const nameInput=element('input');nameInput.name='name';nameInput.autocomplete='name';nameInput.required=true;nameInput.maxLength=100;nameInput.value=response.name;
      const phoneInput=element('input');phoneInput.name='phone';phoneInput.type='tel';phoneInput.autocomplete='tel';phoneInput.required=true;phoneInput.maxLength=30;phoneInput.value=response.phone;phoneInput.placeholder='So we can reach you on WhatsApp';
      form.append(field('Your full name',nameInput),field('Mobile / WhatsApp number',phoneInput));
      if(response.attendance==='yes'){const row=element('div','row');row.append(field('Adults',numberSelect('adults',1,10,response.adults,i=>i===1?'adult':'adults')),field('Children',numberSelect('children',0,8,response.children,i=>i===1?'child':'children')));form.append(row);}
      const next=element('button','ornate-button','Continue →');next.type='submit';const acts=element('div','response-actions');acts.append(button('← Back',()=>{step=0;renderResponse();},'text-button'),next);form.append(acts);
      form.addEventListener('submit',event=>{event.preventDefault();if(!form.reportValidity())return;response.name=nameInput.value.trim();response.phone=phoneInput.value.trim();if(!response.name){nameInput.setCustomValidity('Please enter your name.');nameInput.reportValidity();nameInput.addEventListener('input',()=>nameInput.setCustomValidity(''),{once:true});return;}response.adults=Number(form.elements.adults?.value||1);response.children=Number(form.elements.children?.value||0);step=response.attendance==='no'?3:2;renderResponse();});body.append(form);return;
    }
    if(step===2){
      titleForStep('Celebrations');body.append(element('p','response-lead','Which celebrations will you join?'));
      const form=element('form','response-form');invited.forEach(e=>{const label=element('label','event-check');const input=element('input');input.type='checkbox';input.name='events';input.value=e.id;input.checked=response.events.includes(e.id);const copy=element('span','',e.name);copy.append(element('small','',e.dateLabel.replace(', 2026','')));label.append(input,copy);form.append(label);});
      const dietary=element('textarea');dietary.name='dietary';dietary.maxLength=300;dietary.value=response.dietary;dietary.placeholder='Vegetarian, allergies, or anything we should know';form.append(field('Dietary needs (optional)',dietary));
      const error=element('p','form-error');error.setAttribute('role','alert');const next=element('button','ornate-button','Review response →');next.type='submit';const acts=element('div','response-actions');acts.append(button('← Back',()=>{step=1;renderResponse();},'text-button'),next);form.append(error,acts);
      form.addEventListener('submit',event=>{event.preventDefault();const selected=[...form.querySelectorAll('input:checked')].map(el=>el.value);if(!selected.length){error.textContent='Please choose at least one celebration.';return;}response.events=selected;response.dietary=dietary.value.trim();step=3;renderResponse();});body.append(form);return;
    }
    if(step===3){
      titleForStep('Your Response');const dl=element('dl','review');
      const rows=[['Guest',response.name],['WhatsApp',response.phone],['Response',response.attendance==='yes'?`Attending · ${response.adults} ${response.adults===1?'adult':'adults'}${response.children?` · ${response.children} ${response.children===1?'child':'children'}`:''}`:'Unable to attend'],['Celebrations',response.attendance==='yes'?response.events.map(id=>byId.get(id).name).join(' · '):'Regretfully declining']];
      if(response.attendance==='yes'&&response.dietary)rows.push(['Dietary',response.dietary]);
      rows.forEach(([key,value])=>dl.append(element('dt','',key),element('dd','',value)));body.append(dl);
      const note=element('textarea');note.name='note';note.maxLength=300;note.value=response.note;note.placeholder='A message for Nayha & Saad (optional)';const noteWrap=element('div','response-form');noteWrap.append(field('A note',note));body.append(noteWrap);
      const actions=element('div','response-actions');
      const send=button(rsvpLive?'Send response':'Finish',async()=>{response.note=note.value.trim();send.disabled=true;const ok=await submitResponse();step=4;renderResponse();if(rsvpLive&&!ok)notify('We could not send that just now — please try again or message us on WhatsApp.');});
      actions.append(button('Edit details',()=>{step=1;renderResponse();},'text-button'),send);body.append(actions);return;
    }
    titleForStep('With Love');body.append(element('h3','',CONFIG.coupleShort));
    body.append(element('p','confirmation',response.attendance==='yes'?'We look forward to celebrating together.':'Thank you for sharing your wishes with us.'));
    body.append(element('p','confirmation',rsvpLive?'Your response has been received.':'Online responses open shortly — please WhatsApp us in the meantime.'));
    if(CONFIG.contact.phone){const c=element('p','contact-line');c.append(`Questions? Message ${CONFIG.contact.name} on `);const a=element('a','','WhatsApp');a.href=`https://wa.me/${CONFIG.contact.phone}`;a.target='_blank';a.rel='noopener';c.append(a);body.append(c);}
    body.append(button('Our celebrations',()=>go('celebrations')));
  }

  /* ── Wire up ────────────────────────────────────────────────── */
  document.querySelectorAll('[data-go]').forEach(el=>el.addEventListener('click',()=>go(el.dataset.go)));
  document.querySelectorAll('[data-detail]').forEach(el=>el.addEventListener('click',()=>openDetails(el.dataset.detail,el)));
  document.querySelectorAll('.dialog-close,.dialog-done').forEach(el=>el.addEventListener('click',closeDetails));
  $('calendar-all').addEventListener('click',downloadAll);
  const contact=$('contact-line');
  if(CONFIG.contact.phone){contact.hidden=false;contact.replaceChildren();contact.append(`Questions? Message ${CONFIG.contact.name}, ${CONFIG.contact.role}, on `);const a=element('a','','WhatsApp');a.href=`https://wa.me/${CONFIG.contact.phone}`;a.target='_blank';a.rel='noopener';contact.append(a);}
  else contact.hidden=true;
  window.addEventListener('hashchange',renderRoute);
  renderCards();renderRoute();
  window.InvitationSuite=Object.freeze({CONFIG,events,invited,calendar,escapeICS,currentRoute,googleCalendarUrl});
})();
