import { Metadata } from 'next';
import { QuoteForm } from '@/components/quote/quote-form';

export const metadata: Metadata = {
  title: 'Demander un devis | Taqendurt',
  description: 'Demandez un devis pour votre robe kabyle sur-mesure',
};

export default function DevisPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="py-16 px-6 max-w-7xl mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-6">
          <h1 className="text-5xl md:text-6xl font-bold">
            Demander un devis
          </h1>
          <p className="text-xl text-muted-foreground">
            Décrivez votre projet de robe sur-mesure et nous vous répondrons
            rapidement avec un devis personnalisé
          </p>
        </div>
      </section>

      {/* Form */}
      <section className="pb-24 px-6 max-w-4xl mx-auto">
        <QuoteForm />
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-primary/5">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Comment ça marche ?
          </h2>
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold">Décrivez votre projet</h3>
              <p className="text-muted-foreground">
                Remplissez le formulaire avec vos préférences et ajoutez des
                photos de référence
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold">Nous vous répondons</h3>
              <p className="text-muted-foreground">
                Notre équipe étudie votre demande et vous envoie un devis
                détaillé sous 24-48h
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold">Échangez avec nous</h3>
              <p className="text-muted-foreground">
                Discutez des détails, partagez vos idées via notre système de
                messagerie
              </p>
            </div>
            <div className="space-y-4 text-center">
              <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mx-auto">
                4
              </div>
              <h3 className="text-xl font-semibold">Validez et commandez</h3>
              <p className="text-muted-foreground">
                Une fois le devis validé, nous lançons la confection de votre
                robe
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
