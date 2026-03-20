import React from 'react';
import ReduxSample from '../example/ReduxSample';
import ButtonLink from '../ui/ButtonLink';
import { Link } from 'react-router-dom';
import betafishSvg from '../../assets/betafish.svg';

function WelcomeScreen() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">

      <img src={betafishSvg} alt="Betafish" className="m-5" />
      <h1 className="text-7xl text-white">Betafish</h1>

      <div className="bg-stone-800 rounded-lg m-5 shadow-md p-6 w-full text-zinc-300 max-w-sm">
        <ButtonLink to="/new">
          New Game
        </ButtonLink>
        <ButtonLink to="/card-printer">
          Card Printers
        </ButtonLink>

        {/* <ButtonLink to="/game">
          Load Game
        </ButtonLink> */}
      </div>
    </div >
  );
}

export default WelcomeScreen;