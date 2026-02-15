//
//  index.tsx
//
//  The MIT License
//  Copyright (c) 2021 - 2026 O2ter Limited. All rights reserved.
//
//  Permission is hereby granted, free of charge, to any person obtaining a copy
//  of this software and associated documentation files (the "Software"), to deal
//  in the Software without restriction, including without limitation the rights
//  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
//  copies of the Software, and to permit persons to whom the Software is
//  furnished to do so, subject to the following conditions:
//
//  The above copyright notice and this permission notice shall be included in
//  all copies or substantial portions of the Software.
//
//  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
//  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
//  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
//  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
//  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
//  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
//  THE SOFTWARE.
//

import _ from 'lodash';
import { useProto, useProtoSchema } from '../../proto';
import { useTheme } from '../../components/theme';
import { useResource } from 'frosty';
import { useLocation } from 'frosty/web';
import { normalizeColor, getRed, getGreen, getBlue, rgba, toHexString, mixColor } from '@o2ter/colors.js';
import { Spinner } from '../../components/spinner';

type DashboardStats = {
  classCount: number;
  configCount: number;
};

const StatCard = ({ 
  title, 
  value, 
  description 
}: { 
  title: string; 
  value: number | string; 
  description?: string; 
}) => {
  const theme = useTheme();
  
  const cardBg = mixColor(theme.colors.primary, '#ffffff', 0.02);
  const borderColor = mixColor(theme.colors.primary, '#e5e7eb', 0.1);
  const titleColor = theme.colorContrast(cardBg);
  const valueColor = theme.colors.primary;
  
  const withOpacity = (color: string, opacity: number) => {
    const normalized = normalizeColor(color);
    if (!normalized) return color;
    return toHexString(rgba(
      getRed(normalized),
      getGreen(normalized),
      getBlue(normalized),
      Math.round(255 * opacity)
    ), true);
  };
  
  const descriptionColor = withOpacity(titleColor, 0.6);

  return (
    <div style={{
      backgroundColor: cardBg,
      borderRadius: `${theme.borderRadius.lg}px`,
      padding: `${theme.spacing.lg}px`,
      border: `1px solid ${borderColor}`,
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.15)',
      },
    }}>
      <div style={{
        fontSize: `${theme.fontSize.sm}px`,
        fontWeight: theme.fontWeight.medium,
        color: descriptionColor,
        marginBottom: `${theme.spacing.xs}px`,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {title}
      </div>
      <div style={{
        fontSize: `${theme.fontSize.lg * 2}px`,
        fontWeight: theme.fontWeight.semibold,
        color: valueColor,
        marginBottom: description ? `${theme.spacing.xs}px` : 0,
      }}>
        {value}
      </div>
      {description && (
        <div style={{
          fontSize: `${theme.fontSize.sm}px`,
          color: descriptionColor,
        }}>
          {description}
        </div>
      )}
    </div>
  );
};

const QuickLink = ({ 
  title, 
  description, 
  onClick 
}: { 
  title: string; 
  description: string; 
  onClick: () => void; 
}) => {
  const theme = useTheme();
  const linkBg = mixColor(theme.colors.primary, '#ffffff', 0.02);
  const borderColor = mixColor(theme.colors.primary, '#e5e7eb', 0.1);
  const titleColor = theme.colors.primary;
  
  const withOpacity = (color: string, opacity: number) => {
    const normalized = normalizeColor(color);
    if (!normalized) return color;
    return toHexString(rgba(
      getRed(normalized),
      getGreen(normalized),
      getBlue(normalized),
      Math.round(255 * opacity)
    ), true);
  };
  
  const textColor = theme.colorContrast(linkBg);
  const descriptionColor = withOpacity(textColor, 0.7);
  const hoverBg = mixColor(theme.colors.primary, '#ffffff', 0.05);

  return (
    <div
      onClick={onClick}
      style={{
        backgroundColor: linkBg,
        borderRadius: `${theme.borderRadius.md}px`,
        padding: `${theme.spacing.md}px`,
        border: `1px solid ${borderColor}`,
        cursor: 'pointer',
        transition: 'background-color 0.2s ease, border-color 0.2s ease',
        '&:hover': {
          backgroundColor: hoverBg,
          borderColor: theme.colors.primary,
        },
      }}
    >
      <div style={{
        fontSize: `${theme.fontSize.md}px`,
        fontWeight: theme.fontWeight.semibold,
        color: titleColor,
        marginBottom: `${theme.spacing.xs}px`,
      }}>
        {title}
      </div>
      <div style={{
        fontSize: `${theme.fontSize.sm}px`,
        color: descriptionColor,
      }}>
        {description}
      </div>
    </div>
  );
};

export const HomePage = () => {
  const proto = useProto();
  const schema = useProtoSchema();
  const theme = useTheme();
  const location = useLocation();

  const { resource: stats, loading } = useResource<DashboardStats>(async () => {
    const config = await proto.config({ master: true });
    const configCount = _.keys(config).length;
    const classCount = _.keys(schema).length;

    return {
      classCount,
      configCount,
    };
  }, [schema]);

  const withOpacity = (color: string, opacity: number) => {
    const normalized = normalizeColor(color);
    if (!normalized) return color;
    return toHexString(rgba(
      getRed(normalized),
      getGreen(normalized),
      getBlue(normalized),
      Math.round(255 * opacity)
    ), true);
  };

  const backgroundColor = mixColor(theme.colors.primary, '#fafbfc', 0.02);
  const textColor = theme.colorContrast(backgroundColor);
  const subtitleColor = withOpacity(textColor, 0.7);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%',
        backgroundColor,
      }}>
        <div style={{ width: '40px', height: '40px' }}>
          <Spinner color={theme.colors.primary} />
        </div>
      </div>
    );
  }

  const firstSchema = _.keys(schema).sort()[0];

  return (
    <div style={{
      padding: `${theme.spacing.xl}px`,
      backgroundColor,
      minHeight: '100%',
      color: textColor,
    }}>
      {/* Welcome Section */}
      <div style={{ marginBottom: `${theme.spacing.xl}px` }}>
        <h1 style={{
          fontSize: `${theme.fontSize.lg * 2.5}px`,
          fontWeight: theme.fontWeight.semibold,
          color: textColor,
          marginTop: 0,
          marginBottom: `${theme.spacing.xs}px`,
        }}>
          Welcome to Divermeter
        </h1>
        <p style={{
          fontSize: `${theme.fontSize.md}px`,
          color: subtitleColor,
          margin: 0,
        }}>
          Your proto.io backend administration dashboard
        </p>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: `${theme.spacing.lg}px`,
        marginBottom: `${theme.spacing.xl}px`,
      }}>
        <StatCard
          title="Classes"
          value={stats?.classCount ?? 0}
          description="Database schemas configured"
        />
        <StatCard
          title="Config Entries"
          value={stats?.configCount ?? 0}
          description="Configuration settings"
        />
      </div>

      {/* Quick Links Section */}
      <div style={{ marginBottom: `${theme.spacing.xl}px` }}>
        <h2 style={{
          fontSize: `${theme.fontSize.lg * 1.5}px`,
          fontWeight: theme.fontWeight.semibold,
          color: textColor,
          marginTop: 0,
          marginBottom: `${theme.spacing.md}px`,
        }}>
          Quick Actions
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: `${theme.spacing.md}px`,
        }}>
          {firstSchema && (
            <QuickLink
              title="Browse Data"
              description={`Explore records in ${firstSchema} and other classes`}
              onClick={() => location.pushState({}, `/classes/${firstSchema}`)}
            />
          )}
          <QuickLink
            title="Manage Configuration"
            description="View and edit backend configuration settings"
            onClick={() => location.pushState({}, '/config')}
          />
        </div>
      </div>

      {/* About Section */}
      <div style={{
        backgroundColor: mixColor(theme.colors.primary, '#ffffff', 0.03),
        borderRadius: `${theme.borderRadius.lg}px`,
        padding: `${theme.spacing.lg}px`,
        border: `1px solid ${mixColor(theme.colors.primary, '#e5e7eb', 0.1)}`,
      }}>
        <h3 style={{
          fontSize: `${theme.fontSize.lg}px`,
          fontWeight: theme.fontWeight.semibold,
          color: textColor,
          marginTop: 0,
          marginBottom: `${theme.spacing.sm}px`,
        }}>
          About Divermeter
        </h3>
        <p style={{
          fontSize: `${theme.fontSize.md}px`,
          color: subtitleColor,
          margin: 0,
          lineHeight: 1.6,
        }}>
          Divermeter is a powerful admin dashboard for proto.io backends. Browse your database schemas,
          manage data records, and configure your backend settings all in one place. Navigate using the
          sidebar to explore different sections of your application.
        </p>
      </div>
    </div>
  );
};
