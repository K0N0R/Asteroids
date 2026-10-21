# 0.112 — lifting Saturna

Moduł `saturnAppearance.ts` przedstawia atmosferę w kremowych, złotych i przygaszonych ochrowych warstwach. Pasy mają delikatnie falujące krawędzie, cienkie smugi i małe wiry, subtelniejsze niż na Jowiszu. Kierunek pasm jest zgodny z nachyleniem pierścieni. Glob ma zakrzywioną granicę cienia.

Pierścienie zastępują dawną grubą elipsę i niedopasowany przedni łuk. Nowe półpierścienie są zbudowane z tych samych spłaszczonych, współśrodkowych pasów, nachylonych o -0,36 rad. Tylna część jest pod planetą, przednia nad nią. Szerokie jasne grupy rozdziela rzeczywista przezroczysta przerwa; cieńsze bruzdy i zewnętrzny pas nadają detal w większej skali. Wewnętrzna część jest ciemniejsza i częściowo przezroczysta.

Nowy `planetView('saturn')` działa na mapie, w bazie oraz podczas lotu. Zachowano promień globu i parametry paralaksy. To lifting ilustracji; nie zmienia geometrii sektora, zadań ani fizyki. Cała ilustracja nadal korzysta ze statycznego cache tekstury. Format kampanii 66 i dziennika 29 bez zmian.

Weryfikacja: duży i mały podgląd przeglądarkowy, poprawne zasłanianie obu połówek pierścieni przez glob; cztery istniejące testy warstwy planet i paralaksy; typecheck, lint zmienionych modułów oraz build release.
