import React, { type HTMLAttributes, type ReactNode } from 'react';
import type { CardElevation } from '../../types/index.js';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: CardElevation;
  interactive?: boolean;
  children: ReactNode;
}

export const Card: React.FC<CardProps> = ({
  elevation = 'flat',
  interactive = false,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={`celebrate-card celebrate-card--${elevation} ${
        interactive ? 'celebrate-card--interactive' : ''
      } ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ children, className = '', ...rest }) => (
  <div className={`celebrate-card__header ${className}`} {...rest}>
    {children}
  </div>
);

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  as?: 'h2' | 'h3' | 'h4' | 'h5';
}

export const CardTitle: React.FC<CardTitleProps> = ({
  children,
  as: Component = 'h3',
  className = '',
  ...rest
}) => (
  <Component className={`celebrate-card__title ${className}`} {...rest}>
    {children}
  </Component>
);

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
}

export const CardDescription: React.FC<CardDescriptionProps> = ({
  children,
  className = '',
  ...rest
}) => (
  <p className={`celebrate-card__description ${className}`} {...rest}>
    {children}
  </p>
);

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardBody: React.FC<CardBodyProps> = ({ children, className = '', ...rest }) => (
  <div className={`celebrate-card__body ${className}`} {...rest}>
    {children}
  </div>
);

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export const CardFooter: React.FC<CardFooterProps> = ({ children, className = '', ...rest }) => (
  <div className={`celebrate-card__footer ${className}`} {...rest}>
    {children}
  </div>
);
