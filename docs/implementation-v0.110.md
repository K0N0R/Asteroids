# 0.110 — lifting Merkurego

Nowa warstwa `mercuryTerrain.ts` zastępuje kilkanaście losowych zagłębień pełniejszą, statyczną ilustracją: większymi złotawymi i chłodnymi niebieskoszarymi obszarami, starym basenem uderzeniowym z kilkoma obrzeżami, drobnymi oraz większymi kraterami, uskokami i trzema jaśniejszymi uderzeniami z nieregularnymi promieniami wyrzutowymi. Użyto ograniczonej palety płaskich barw i zaokrąglonych kształtów, zgodnych z pozostałymi planetami.

Kolorystyka nawiązuje do dostarczonej referencji, nie stanowi deklaracji naturalnych barw ani dokładnej mapy geologicznej. Drobne kratery mają stały seed; nie zmieniają się między renderowaniami. Całość pozostaje przycięta do globu i korzysta z istniejącego cache tekstury. Cień ma zakrzywioną granicę, a dekoracyjna poświata jest słabsza, bez dodawania warstwy chmur.

`planetView('mercury')` stosuje tę samą grafikę na mapie Układu Słonecznego, w bazie oraz w tle wyprawy. Promień planety, rozmieszczenie sektora, fizyka, ekspozycja słoneczna i zadania pozostają bez zmian. Format kampanii 66 i dziennika 29 bez zmian.

Weryfikacja: podgląd przeglądarkowy dużej i małej ilustracji; istniejące cztery testy planet i paralaksy; typecheck, lint zmienionych modułów i build release.
