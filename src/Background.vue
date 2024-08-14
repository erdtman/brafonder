
<template>
  <div class="container">
    <h1 class="background">Bakgrund</h1>
    <p>Sedan jag började spara i fonder för ett antal år sedan så har jag (som alla andra) letat efter fonder med hög och stabil avkastning. Jag har spenderat en hel del tid på att klicka runt och kolla historisk utveckling på olika fonder. Men de mått på historisk utveckling som jag hittat på olika sajter har inte varit till tillfredsställande. De flesta sajter har värden för senaste 10 åren, 5 åren, 3 åren och 1 år. Oftast kan man även mata in specifika datum. Detta är inte dåligt men om man skall utvärdera de 1000+ fonder som finns tillgängliga via Avanza så blir det väldigt tidskrävande.</p>
    <p>Det jag nu har byggt här är en utvärdering av alla 5, 10 och 1 års perioder med en månads steg för alla fonder tillgängliga via Avanza.</p>
    <h2 class="background">Att tänka på</h2>
    <p>Historisk avkastning är ingen garanti för framtida avkastning. Jag använder siffrorna här som ett första steg i att sålla bland de över 1000 fonderna som finns tillgängliga. Dvs jag använder inte informationen här som enda urvalskriterium när jag väljer mina fonder.</p>
    <p>En fond som inte funnits så länge kan hamna högre än en som funnits länge med enda anledningen att den nyare inte varit med om några större kriser. Detta blir tydligt med indexfonder som bör vara identiska (förutom avgiften kanske). Ett exempel är <i>Länsförsäkringar USA Indexnära</i> som landar högt medan <i>SPP Aktiefond USA A SEK</i> som är äldre landar mycket längre ned. Jag brukar därför gärna filtrera ut allt som har mindre än 100 datapunkter (men där gör man som man vill).</p>
    <p><a target="_blank" href="https://sv.wikipedia.org/wiki/%C3%96verlevnadsbias">Överlevnadsbias</a>, fonder som inte levererat god avkastning avslutas ofta av fondbolagen, vilket då gör att fonder som funnits länge kanske inte nödvändigtvis är bättre än andra utan kanske bara har haft tur.</p>
    <p>Med den här typen av analys krävs lång historik vilket gör att man begränsar sina valmöjligheter en hel del och kanske missar en fantastisk fond som är ganska ny.</p>
    <h2 class="background">Så funkar det</h2>
    <p>För varje fond kollar jag på alla 10, 5 och 1 års perioder med en månaders steg. Dvs jag börjar med att kolla utveckling för 1998-01-01 till 2008-01-01, sedan tar jag 1998-02-01 till 2008-02-01, sedan tar jag 1998-03-01 till 2008-03-01 osv tills det inte finns fler 10 års perioder. Jag samlar dessa i en list som jag sedan räknar ut median, medelvärde och <a target="_blank" href="https://sv.wikipedia.org/wiki/Standardavvikelse">standardavvikelse</a> för. Och så repeterar jag för 5 och 1 års perioder.</p>
    <h2 class="background">Vanliga frågor</h2>
    <h3>Varifrån kommer datan?</h3>
    <p>Jag har laddat ner den från Avanzas publika sida, de har inget officiet API så jag har helt enkelt kollat vad webbläsaren gör och imiterat det, koden för nedladdning av data finns tillgänglig <a target="_blank" href="https://github.com/erdtman/brafonder/tree/master/read_data_src">här</a>.</p>
    <h3 class="background">Hur ofta uppdaterar du datan?</h3>
    <p>Målet är göra en uppdatering en gång om året, då har det tillkommit 12 datapunkter vilket kanske kan göra skillnad för resultatet. Uppdaterat med data fram till 2024-06-31.</p>
    <h3 class="background">Är avkastningen här före eller efter fondavgifter?</h3>
    <p>Som jag förstår det från <a target="_blank" href="https://www.avanza.se/lar-dig-mer/avanza-akademin/fonder/vilka-avgifter-har-fonder.html">avanzas hemsida</a> så är datan efter avgifter är dragna. Dvs siffran du ser här är den avkastning som du faktiskt skulle ha fått.</p>
    <h2 class="background">Kontakt</h2>
    <p>Nej, tack.</p>
    <h2 class="background">Rapportera tekniska problem eller förbättringsförslag</h2>
    <p>Om du hittar tekniska problem med sidan eller har tankar kring hur sidan skulle kunna förbättras så får du gärnat skriva en rapport på <a target="_blank" href="https://github.com/erdtman/brafonder">github</a>.</p>
  </div>
</template>

<script>
</script>
