# Orbit 0.29 - specjalizacje floty

## Uzbrojenie i mocowania

- Lasery wydobywcze zatrzymują się na pierwszej przeszkodzie. Wrogim statkom zadają bazowo 12 HP/s na laser, wobec 150 HP/s przeciw skałom. Działają premie wydobycia, ale kontakt wiązki nie przerywa co klatkę ładowania broni wroga.
- Prospector: działko `(25, -14)`, laser `(25, 14)`, oba z przodu. Przy dziobie skierowanym w górę działko jest po lewej, laser po prawej.
- Manta: działko `(24, -20)`, laser `(24, 20)`, oba z przodu.
- Aegis: jeden chwytak `(-24, 0)`, bez zmiany działka, drona i impulsu tarcz.
- Bastion: dwa działka na LPM, bez lasera. PPM wystrzeliwuje granaty: 45 obrażeń, promień 65 m, prędkość 320 m/s, zapalnik 0,7 s, odstęp 0,55 s. Kontakt przyspiesza eksplozję; osłony blokują obrażenia obszarowe, bez friendly fire. Moduł salwy dodaje granat na poziom.

## Widmo

Swift zmienia nazwę na Widmo; zapisany identyfikator `swift` pozostaje zgodny ze starszymi kampaniami. Liczba typów kadłubów nadal wynosi dziewięć.

Nowy model według referencji ma smukły grafitowy korpus, zakrzywione skrzydła, turkusowe akcenty, wydłużony ogon i szklany niebieski kokpit. Jedno działko na LPM i jeden chwytak pozostają, laser usunięto. Kolizja została dopasowana do szerszych skrzydeł; parametry napędu i ceny nie zmieniają się.

PPM aktywuje kamuflaż optyczny na **3 s**. Wrogowie nie mogą wykryć bieżącej pozycji, aktualizować punktu celowania ani strzelać do Widma; mogą wracać do ostatniego znanego miejsca lub wybrać widoczną eskortę. Skaner Cerbera także nie wykrywa ukrytego statku. Kamuflaż nie usuwa istniejących pocisków ani kolizji i nie daje odporności na trafienia.

Bazowe odnowienie: **12 s od aktywacji**. Przytrzymanie PPM nie przedłuża ani nie powtarza działania. Kolejne użycie wymaga gotowej umiejętności i nowego naciśnięcia. Ogień i boost nie przerywają tych 3 s. Pauza i wybór prototypu zatrzymują oba zegary. C nie włącza na Widmie dawnego bezterminowego kamuflażu.

Dawny moduł lasera staje się projektorem kamuflażu: odnowienie `12 / (1 + poziom * 0,2)` s, czas działania zawsze 3 s. Dotychczasowe poziomy modułu są zachowane.

## Mule

Usunięto działko. **LPM** obsługuje dwa lasery wydobywcze; **PPM** tworzy zestaw naprawczy, pod warunkiem że zapas pokładowy wynosi **0**.

Koszt pochodzi z przepisu stacji i jest podwójny: **12 rudy / 2 komponenty**. Pobierane są tylko surowce już zebrane do ładowni, nie zapas stacji ani jednostki będące jeszcze w chwytaku. Brak dowolnego materiału lub istniejący zestaw blokuje produkcję bez częściowego pobrania kosztu. Kryształy pozostają nietknięte.

Nie ma limitu liczby produkcji na wyprawę. Po zużyciu zestawu można stworzyć następny, ponownie płacąc koszt. Zestaw działa przez standardową naprawę **R**: spokojny lot, 5 s nieprzerwanego działania, naprawa kadłuba i napędu. Po zakończeniu lub pauzie misji produkcja nie postępuje.

## Podwójny hol Manty

Manta ma dwa niezależne sloty fizycznego holu. Pozostałe statki zachowują jeden. E podejmuje kolejny pobliski niepodłączony wrak, dopóki są wolne sloty. Można holować dwa wraki albo wrak i wybrany cel ratunkowy. Nie zwiększa to ładowni surowców.

Każdy hol ma własną linę Rapiera, boczny punkt zaczepu, HP i historię dostawy. Zniszczenie jednego nie odłącza drugiego. J zwalnia holowane wraki, ale nie cel ratunkowy. Automatyczne przekazanie sprawdza każdy obiekt osobno; dokowanie E wymaga, by oba dotarły do Aurory. Każda dostawa rozliczana jest raz i korzysta z dotychczasowego dziennika zapisu.

HUD, radar, podpowiedzi i panel pokładu uwzględniają oba hole. Obie liny są rysowane od tych samych punktów zaczepu, których używa fizyka.

## Zgodność i weryfikacja

Format kampanii pozostaje 15. Zachowano identyfikatory kadłubów, moduły, posiadane bronie i tożsamości wraków. Kadłub bez działka nie pozwala montować zwykłej broni. Aktualny zapis nie wymaga dodatkowych pól dla czasowych umiejętności wyprawy.

Testy obejmują układy wyposażenia, obrażenia i przeszkody dla laserów, kamuflaż i skaner, brak odnawiania przy trzymanym PPM, ulepszenia projektora, płatną produkcję i użycie zestawów, granaty Bastiona oraz fizykę, utratę i rozliczanie dwóch holi. Kontrole: `npm test`, `npm run typecheck`, `npm run lint`, `npm run build`.
