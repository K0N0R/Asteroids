# Implementacja 0.59 — misja ratunkowa i zabezpieczenie promu

Stan: 2026-10-16. Dalsza rozbudowa aktu I.

## Grywalny zakres

Po zwiadzie podejścia księżycowego pojawia się dodatkowy **Sygnał ratunkowy**. Wybór tej wyprawy tworzy uszkodzony sojuszniczy prom na orbicie i dwa kontakty patrolowe w jego rejonie. Zadanie nie blokuje budowy bazy ani dalszej kampanii. Nie jest odzyskiem własnego utraconego pilota lub kadłuba; istniejący system ratowania własnej floty pozostaje niezależny.

Przebieg: dolot i zabezpieczenie rejonu → połączenie obwodów promu → podpięcie holu → fizyczne odprowadzenie do Satuk 15 → własny powrót z raportem. **N** wskazuje prom, **E** przy spokojnym podejściu poniżej 60 m/s otwiera panel. Nie wystarcza przytrzymać E, aby ominąć zabezpieczenie.

Panel wymaga połączenia trzech par oznaczonych **A / Zasilanie**, **B / Podtrzymanie**, **C / Sterowanie**. Wybiera się końcówkę po lewej, potem odpowiadającą jej końcówkę po prawej. Kolejność prawej listy wynika z seeda próby. Błędna para pokazuje komunikat bez zużywania zasobów. Wszystkie trzy połączenia i osobne zatwierdzenie zabezpieczają prom.

Świat pod panelem nadal działa. Sterowanie lotem i bronią jest neutralne, istniejący opór wyhamowuje jednostkę. Trafienie gracza lub promu, utrata zasięgu i zbyt duża prędkość przerywają pracę; ponowienie zaczyna połączenia od początku. Zabezpieczenie nie wymaga zestawu naprawczego i nie odnawia kadłuba promu — początkowo ma on **80/120 HP**.

Po zabezpieczeniu **E przez 3 s** podpina rzeczywistą linę Rapiera. **J** pozwala odłączyć prom i podpiąć go ponownie bez ponawiania zakończonego zabezpieczenia. Ruch, kolizje i ostrzał mogą uszkodzić cel. Dopiero wprowadzenie promu w obszar doku dodaje raport ratunkowy; samo podpięcie lub własny powrót z promem pozostawionym w przestrzeni nie wystarcza.

Własne dokowanie zatwierdza jednorazową nagrodę **12 Fe i 5 komponentów**. Prom ani dodatkowy pilot nie trafiają do floty. Zniszczenie celu pozostawia czytelny komunikat i możliwość **TAB → odwrót**; nowa próba tworzy świeży uszkodzony prom. Śmierć, odświeżenie i odwrót tracą niezatwierdzony raport. Podczas aktywnego ratunku nie można przejść do instancji powierzchniowej z niedostarczonym promem.

## Interfejs i oprawa

Osobna sylwetka promu, pulsujący sygnał, pasek kadłuba, oznaczenie na radarze i widoczna lina. HUD pokazuje zabezpieczenie, podpinanie, hol, dostawę i utratę celu. Wspólny kontener interakcji obsługuje zarówno wcześniejsze strojenie łączności, jak i nowy panel obwodów, bez zatrzymywania symulacji.

Przy wybranym rozkazie ukryty jest osobny przycisk lotu z dostawą budowlaną, aby nie przełączyć przypadkiem wyprawy na transport surowców. Swobodny lot nadal udostępnia dostawy.

## Zapis

Format kampanii **38**, dziennika **17**. Nowy cel ratunkowy i typ rozkazu; poprzednie formaty są odrzucane, bez migracji. Nie dodano wznawiania aktywnego lotu ani zapisu częściowo połączonych obwodów.

## Weryfikacja

- **415/415 testów**, bez pominięć; pięć nowych prób ratunku.
- Model obwodów: niezgodne pary, nieprawidłowy indeks, wymagane trzy połączenia i osobne zatwierdzenie.
- Symulacja: przytrzymywanie E nie podpina niezabezpieczonego promu; czas nadal biegnie; utrata zasięgu usuwa częściowy postęp.
- Pełna zwykła wyprawa: bazowy Prospector fizycznie dolatuje, pokonuje dwa drony zwykłym uzbrojeniem, uruchamia zabezpieczenie przez interakcję, łączy obwody, podpina linę, odholowuje prom i dokuje. Test nie teleportuje statków ani nie dodaje raportu ręcznie. Sprawdza brak zaliczenia przed dostawą, jednokrotną nagrodę, poprawny zapis, zachowanie zestawu oraz brak darmowego kadłuba. Wejście przygotowuje dotychczasowy legalny postęp do zwiadu Księżyca; nie zastępuje przejścia całej kampanii od nowego zapisu.
- Osobne próby potwierdzają odłączenie i ponowne podpięcie, zniszczenie celu prawdziwym pociskiem, zamknięcie panelu, brak nagrody i świeżą próbę po odwrocie.
- Typecheck, lint i produkcyjny build przeszły.
- Przeglądarka 1280×720: wybór misji i usunięcie przycisku dostawy przy rozkazie; normalny start i próba dolotu. Panel, błędną parę, komplet połączeń i podpięcie holu sprawdzono następnie na osobnym tymczasowym buildzie QA z przygotowanym położeniem przy promie i wyłączonym patrolem. Nie jest to pełne ręczne przejście misji. Brak błędów konsoli w próbie panelu. Tymczasowe pliki QA usuwa końcowy produkcyjny build.

Dowody: [wybór misji](validation-v0.59/mission.png), [połączone obwody](validation-v0.59/wiring.png), [prom na holu](validation-v0.59/tow.png).

## Kolejny krok

Rozbudowa powierzchni Księżyca: większa przestrzeń, niszczalne formacje i ciekawsze działania przy placówce. Animacje przejść, dalsze role przeciwników, bazy produkujące jednostki i drony strażnicze pozostają w kolejnych pakietach.
